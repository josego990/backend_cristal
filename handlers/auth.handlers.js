const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const BCRYPT_ROUNDS_RAW = Number(process.env.BCRYPT_ROUNDS || 10);
const BCRYPT_ROUNDS =
  Number.isInteger(BCRYPT_ROUNDS_RAW) && BCRYPT_ROUNDS_RAW > 3 ? BCRYPT_ROUNDS_RAW : 10;

function assertBody(req, fields) {
  for (const f of fields) {
    if (
      req.body?.[f] === undefined ||
      req.body?.[f] === null ||
      String(req.body[f]).trim() === ''
    ) {
      const e = new Error(`Falta campo: ${f}`);
      e.status = 400;
      throw e;
    }
  }
}

function toText(v) {
  const s = v === null || v === undefined ? '' : String(v);
  const t = s.trim();
  return t.length ? t : null;
}

function toBit(v) {
  if (v === true || v === 1) return 1;
  if (v === false || v === 0) return 0;

  const s = String(v ?? '').trim().toLowerCase();
  if (['si', '1', 'true', 'yes', 'y', 'on'].includes(s)) return 1;
  if (['no', '0', 'false', 'off', 'n'].includes(s)) return 0;
  return null;
}

function toNumberOrNull(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getJwtSecret() {
  return process.env.JWT_SECRET || 'DEV_ONLY_CHANGE_ME';
}

function sanitizeAuthUser(row) {
  const bit = toBit(row?.ChangePassword ?? row?.changePassword);
  return {
    userId: Number(row?.UserId ?? row?.userId ?? 0) || null,
    username: toText(row?.Username ?? row?.username),
    name: toText(row?.FullName ?? row?.fullName),
    fullName: toText(row?.FullName ?? row?.fullName),
    rol: toText(row?.Rol ?? row?.rol),
    idClinica: toNumberOrNull(row?.IdClinica ?? row?.idClinica),
    changePassword: bit === 1
  };
}

function buildJwtPayload(user) {
  return {
    sub: user.userId,
    userId: user.userId,
    username: user.username,
    name: user.fullName,
    fullName: user.fullName,
    rol: user.rol,
    idClinica: user.idClinica,
    changePassword: user.changePassword === true
  };
}

function signToken(user) {
  return jwt.sign(buildJwtPayload(user), getJwtSecret(), { expiresIn: '60m' });
}

function getSqlErrorNumber(err) {
  return Number(
    err?.number ??
      err?.originalError?.info?.number ??
      err?.precedingErrors?.[0]?.number ??
      NaN
  );
}

async function getUserAuthRowByUserId(req, userId) {
  const r = await req.db
    .request()
    .input('UserId', req.sql.Int, userId)
    .query(
      `
      SELECT TOP (1)
        UserId,
        Username,
        PasswordHash,
        FullName,
        Rol,
        IdClinica,
        IsActive,
        ChangePassword
      FROM dbo.Users
      WHERE UserId = @UserId
      `
    );

  return r.recordset?.[0] || null;
}

/**
 * POST /api/auth/login
 * body: { username, password }
 */
async function login(req, res) {
  try {
    assertBody(req, ['username', 'password']);

    const username = String(req.body.username).trim();
    const password = String(req.body.password);

    const r = await req.db
      .request()
      .input('Username', req.sql.NVarChar(60), username)
      .execute('spAuth_GetUserByUsername');

    const row = r.recordset?.[0];
    if (!row || !row.IsActive) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, row.PasswordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const hydratedRow =
      row?.ChangePassword === undefined && row?.changePassword === undefined
        ? (await getUserAuthRowByUserId(req, row?.UserId ?? row?.userId)) || row
        : row;

    const user = sanitizeAuthUser(hydratedRow);
    const token = signToken(user);

    return res.json({ token, user });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Error' });
  }
}

/**
 * GET /api/auth/me
 * Requiere middleware JWT que setee req.user
 */
async function me(req, res) {
  try {
    const userId = Number(req.user?.userId ?? req.user?.sub);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.json({ user: req.user || null });
    }

    const row = await getUserAuthRowByUserId(req, userId);
    if (!row) return res.json({ user: null });

    return res.json({ user: sanitizeAuthUser(row) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/**
 * PUT /api/auth/change-password
 * body: { currentPassword, newPassword }
 */
async function changePassword(req, res) {
  try {
    assertBody(req, ['currentPassword', 'newPassword']);

    const userId = Number(req.user?.userId ?? req.user?.sub);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(401).json({ message: 'Token invalido o expirado' });
    }

    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');

    if (!currentPassword.trim() || !newPassword.trim()) {
      return res.status(400).json({ message: 'currentPassword y newPassword son requeridos' });
    }
    if (newPassword.trim().length < 6) {
      return res.status(400).json({ message: 'newPassword debe tener al menos 6 caracteres' });
    }

    const currentRow = await getUserAuthRowByUserId(req, userId);
    if (!currentRow) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (!currentRow.IsActive) {
      return res.status(403).json({ message: 'Usuario inactivo' });
    }

    const ok = await bcrypt.compare(currentPassword, String(currentRow.PasswordHash || ''));
    if (!ok) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    const r = await req.db
      .request()
      .input('UserId', req.sql.Int, userId)
      .input('PasswordHash', req.sql.NVarChar(255), newPasswordHash)
      .execute('spUsers_ChangePassword');

    const out = r.recordset?.[0] || (await getUserAuthRowByUserId(req, userId));
    if (!out) {
      return res.status(500).json({ message: 'No se obtuvo respuesta al actualizar contraseña' });
    }

    const user = sanitizeAuthUser(out);
    const token = signToken(user);
    return res.json({ ok: true, token, user });
  } catch (err) {
    const number = getSqlErrorNumber(err);
    const message = err?.message || 'Error';
    const lower = String(message).toLowerCase();

    if (number === 50002 || number === 50005 || lower.includes('usuario no existe')) {
      return res.status(404).json({ message });
    }
    if (number >= 50000 && number < 60000) {
      return res.status(400).json({ message });
    }

    return res.status(500).json({ message });
  }
}

module.exports = { login, me, changePassword };
