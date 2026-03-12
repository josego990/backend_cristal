const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const fs = require('fs');
const express = require('express');
const http = require('http');
const https = require('https');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

const auth = require('./handlers/auth.handlers');
const dashboard = require('./handlers/dashboard.handlers');
const patients = require('./handlers/patients.handlers');
const quotations = require('./handlers/quotations.handlers');
const expenses = require('./handlers/expenses.handlers');
const users = require('./handlers/users.handlers');
const inventory = require('./handlers/inventory.handlers');
const clinics = require('./handlers/clinics.handlers');

const app = express();
const host = process.env.HOST || '0.0.0.0';
const httpPort = Number(process.env.PORT || 3000);
const httpsPort = Number(process.env.HTTPS_PORT || 443);
const httpRedirectPort = Number(process.env.HTTP_REDIRECT_PORT || 80);
const useHttps = toBool(process.env.USE_HTTPS, false);
const redirectHttpToHttps = toBool(process.env.HTTP_TO_HTTPS_REDIRECT, false);
const sslKeyPath =
  process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/api.opticlinics.com/privkey.pem';
const sslCertPath =
  process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/api.opticlinics.com/fullchain.pem';
const sslCaPath = process.env.SSL_CA_PATH;
const dbReconnectDelayMs = Number(process.env.DB_RECONNECT_DELAY_MS || 5000);

const variable = '';

let dbPool;
let apiServer;
let redirectServer;
let dbConnecting = false;

function toBool(value, defaultValue) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'si', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return defaultValue;
}

function getJwtSecret() {
  return process.env.JWT_SECRET || 'DEV_ONLY_CHANGE_ME';
}

function getSqlConfig() {
  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT || 1433),
    connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 15000),
    requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT_MS || 30000),
    options: {
      encrypt: toBool(process.env.DB_ENCRYPT, false),
      trustServerCertificate: toBool(process.env.DB_TRUST_SERVER_CERTIFICATE, true)
    },
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: Number(process.env.DB_POOL_MIN || 0),
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS || 30000)
    }
  };
}

function getMissingRequiredEnv() {
  const required = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_DATABASE'];
  return required.filter((name) => {
    const value = process.env[name];
    return value === undefined || value === null || String(value).trim() === '';
  });
}

function getSslOptions() {
  try {
    const options = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };

    if (sslCaPath && String(sslCaPath).trim() !== '') {
      options.ca = fs.readFileSync(sslCaPath);
    }

    return options;
  } catch (error) {
    throw new Error(
      `No se pudieron cargar los certificados SSL. Verifica rutas: key=${sslKeyPath}, cert=${sslCertPath}`
    );
  }
}

async function listenServer(server, listenPort, name) {
  await new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };

    const onListening = () => {
      server.off('error', onError);
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(listenPort, host);
  });

  console.log(`${name} escuchando en ${host}:${listenPort}`);
}

async function closeServer(server) {
  if (!server) return;

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) return reject(error);
      return resolve();
    });
  });
}

function getHttpsRedirectUrl(req) {
  const hostHeader = String(req.headers.host || '').trim();
  const hostWithoutPort = hostHeader ? hostHeader.split(':')[0] : process.env.PUBLIC_HOST || 'localhost';
  const targetPort = httpsPort === 443 ? '' : `:${httpsPort}`;
  return `https://${hostWithoutPort}${targetPort}${req.url || '/'}`;
}

function authMiddleware(req, res, next) {
  const authHeader = String(req.headers.authorization || '').trim();
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const userId =
      payload.userId !== undefined && payload.userId !== null
        ? Number(payload.userId)
        : Number(payload.sub);

    req.user = {
      ...payload,
      userId: Number.isFinite(userId) ? userId : null
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalido o expirado' });
  }
}

const allowCredentials = toBool(process.env.CORS_CREDENTIALS, false);
const logCorsDecisions = toBool(process.env.CORS_DEBUG, false);

function normalizeOrigin(value) {
  if (!value) return '';

  const raw = String(value).trim();
  if (!raw) return '';
  if (raw === 'null') return 'null';
  if (raw === '*') return '*';
  if (raw.toLowerCase() === 'all') return 'all';

  try {
    const u = new URL(raw);
    const protocol = String(u.protocol || '').toLowerCase();
    const host = String(u.hostname || '').toLowerCase();
    const isDefaultPort =
      !u.port ||
      (protocol === 'http:' && u.port === '80') ||
      (protocol === 'https:' && u.port === '443');
    const port = isDefaultPort ? '' : `:${u.port}`;
    return `${protocol}//${host}${port}`;
  } catch (error) {
    return raw.replace(/\/+$/, '').toLowerCase();
  }
}

const rawAllowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((x) => x.trim()).filter(Boolean)
  : [];
const allowedOrigins = rawAllowedOrigins.map((origin) => normalizeOrigin(origin)).filter(Boolean);
const allowAllOrigins =
  allowedOrigins.length === 0 ||
  allowedOrigins.includes('*') ||
  allowedOrigins.includes('all');

function wildcardToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

function isWildcardAllowed(origin) {
  if (!origin) return false;
  return allowedOrigins
    .filter((p) => p.includes('*'))
    .some((pattern) => wildcardToRegExp(pattern).test(origin));
}

function isLocalDevOrigin(origin) {
  if (!origin) return false;

  try {
    const u = new URL(origin);
    const host = String(u.hostname || '').toLowerCase();

    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
    if (host.startsWith('192.168.')) return true;
    if (host.startsWith('10.')) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;

    return false;
  } catch (error) {
    return false;
  }
}


app.use((req, res, next) => {
  const requestOrigin = String(req.headers.origin || '').trim();
  const normalizedOrigin = normalizeOrigin(requestOrigin);
  const isAllowed =
    allowAllOrigins ||
    !requestOrigin ||
    normalizedOrigin === 'null' ||
    allowedOrigins.includes(normalizedOrigin) ||
    isWildcardAllowed(normalizedOrigin) ||
    isLocalDevOrigin(normalizedOrigin);

  if (logCorsDecisions && requestOrigin) {
    console.log(`[CORS] origin=${requestOrigin} normalized=${normalizedOrigin} allowed=${isAllowed}`);
  }

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin || '*');
    res.setHeader('Vary', 'Origin');
  }

  if (allowCredentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-clinic-id'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  return res.json({
    ok: true,
    service: 'opticas-cristal-backend',
    dbConnected: Boolean(dbPool),
    now: new Date().toISOString()
  });
});

app.get('/api-prueba-servicio', (req, res) => {
  return res.json({
    ok: true,
    message: 'Servicio activo',
    now: new Date().toISOString()
  });
});

app.use((req, res, next) => {
  if (!dbPool) {
    return res.status(503).json({ message: 'Base de datos no disponible' });
  }

  req.db = dbPool;
  req.sql = sql;
  return next();
});

app.post('/api/auth/login', auth.login);
app.get('/api/auth/me', authMiddleware, auth.me);

app.get('/api/dashboard/summary', authMiddleware, dashboard.summary);

app.post('/api/patients', authMiddleware, patients.create);
app.get('/api/patients/search', authMiddleware, patients.search);
app.get('/api/patients/order/:orderNo', authMiddleware, patients.getByOrder);
app.get('/api/patients/:id', authMiddleware, patients.getById);
app.put('/api/patients/:id/lab-code', authMiddleware, patients.updateLabCode);
app.put('/api/patients/:id/assign-lab-code', authMiddleware, patients.assignLabCode);
app.put('/api/patients/:id/deliver', authMiddleware, patients.confirmDelivery);

app.post('/api/quotations', authMiddleware, quotations.create);
app.get('/api/quotations', authMiddleware, quotations.list);
app.get('/api/quotations/:id', authMiddleware, quotations.getById);

app.post('/api/expenses', authMiddleware, expenses.create);
app.get('/api/expenses', authMiddleware, expenses.list);

app.post('/api/users', authMiddleware, users.create);
app.get('/api/users', authMiddleware, users.list);
app.put('/api/users/:id', authMiddleware, users.update);

app.post('/api/inventory', authMiddleware, inventory.create);
app.get('/api/inventory', authMiddleware, inventory.list);
app.put('/api/inventory/:id', authMiddleware, inventory.update);
app.post('/api/inventory/:id/decrement', authMiddleware, inventory.decrement);

app.post('/api/clinics', authMiddleware, clinics.create);
app.get('/api/clinics', authMiddleware, clinics.list);
app.get('/api/clinics/user/:userId', authMiddleware, clinics.listByUserId);

app.use((req, res) => {
  return res.status(404).json({ message: 'Ruta no encontrada' });
});
 
app.use((err, req, res, next) => {
  const status = err?.status || 500;
  const message = err?.message || 'Error interno';
  return res.status(status).json({ message });
});

async function start() {
  const missingEnv = getMissingRequiredEnv();
  if (missingEnv.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missingEnv.join(', ')}`);
  }

  if (useHttps) {
    const sslOptions = getSslOptions();
    apiServer = https.createServer(sslOptions, app);
    await listenServer(apiServer, httpsPort, 'API HTTPS');

    if (redirectHttpToHttps) {
      redirectServer = http.createServer((req, res) => {
        const redirectUrl = getHttpsRedirectUrl(req);
        res.writeHead(301, { Location: redirectUrl });
        res.end();
      });

      await listenServer(redirectServer, httpRedirectPort, 'Redireccion HTTP -> HTTPS');
    }
  } else {
    apiServer = http.createServer(app);
    await listenServer(apiServer, httpPort, 'API HTTP');

    if (redirectHttpToHttps) {
      console.warn('HTTP_TO_HTTPS_REDIRECT se ignora porque USE_HTTPS=false');
    }
  }

  await connectDb();
}

async function connectDb() {
  if (dbPool || dbConnecting) return;

  dbConnecting = true;
  console.log('Conectando a DB...');

  try {
    const pool = await new sql.ConnectionPool(getSqlConfig()).connect();
    dbPool = pool;
    console.log('DB conectada');

    pool.on('error', (error) => {
      console.error('Error en pool DB:', error);
      dbPool = null;
      setTimeout(() => {
        connectDb().catch((err) => console.error('Reconexion DB fallida:', err));
      }, dbReconnectDelayMs);
    });
  } catch (error) {
    console.error('No se pudo conectar a DB:', error);
    setTimeout(() => {
      connectDb().catch((err) => console.error('Reconexion DB fallida:', err));
    }, dbReconnectDelayMs);
  } finally {
    dbConnecting = false;
  }
} 

async function shutdown(signal) {
  console.log(`${signal} recibido. Cerrando servidor...`);

  await closeServer(redirectServer);
  await closeServer(apiServer);

  if (dbPool) {
    await dbPool.close();
  }

  process.exit(0);
}

process.on('SIGINT', () => {
  shutdown('SIGINT').catch((error) => {
    console.error('Error al cerrar:', error);
    process.exit(1); 
  });
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM').catch((error) => {
    console.error('Error al cerrar:', error);
    process.exit(1);
  });
});

start().catch((error) => {
  console.error('No se pudo iniciar la API:', error);
  process.exit(1);
});
