require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

const auth = require('./handlers/auth.handlers');
const dashboard = require('./handlers/dashboard.handlers');
const patients = require('./handlers/patients.handlers');
const quotations = require('./handlers/quotations.handlers');
const expenses = require('./handlers/expenses.handlers');

const app = express();
const port = Number(process.env.PORT || 3000);

let dbPool;
let httpServer;

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
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((x) => x.trim()).filter(Boolean)
  : [];
const allowAllOrigins =
  allowedOrigins.length === 0 ||
  allowedOrigins.includes('*') ||
  allowedOrigins.includes('all');

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
  const origin = String(req.headers.origin || '').trim();
  const isAllowed =
    allowAllOrigins ||
    !origin ||
    origin === 'null' ||
    allowedOrigins.includes(origin) ||
    isLocalDevOrigin(origin);

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
  }

  if (allowCredentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
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

  dbPool = await new sql.ConnectionPool(getSqlConfig()).connect();
  console.log('DB conectada');

  httpServer = app.listen(port, () => {
    console.log(`API escuchando en puerto ${port}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} recibido. Cerrando servidor...`);

  if (httpServer) {
    await new Promise((resolve, reject) => {
      httpServer.close((error) => {
        if (error) return reject(error);
        return resolve();
      });
    });
  }

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
