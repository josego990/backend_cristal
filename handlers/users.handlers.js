const bcrypt = require('bcryptjs');

const INVALID_NUMBER = Symbol('invalid_number');
const BCRYPT_ROUNDS_RAW = Number(process.env.BCRYPT_ROUNDS || 10);
const BCRYPT_ROUNDS =
  Number.isInteger(BCRYPT_ROUNDS_RAW) && BCRYPT_ROUNDS_RAW > 3 ? BCRYPT_ROUNDS_RAW : 10;

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function toText(v) {
  const s = v === null || v === undefined ? '' : String(v);
  const t = s.trim();
  return t.length ? t : null;
}

function parseNullablePositiveInt(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) return INVALID_NUMBER;
  return n;
}

function toBit(v) {
  if (v === true || v === 1) return 1;
  if (v === false || v === 0) return 0;

  const s = String(v ?? '').trim().toLowerCase();
  if (['si', '1', 'true', 'yes', 'y', 'on'].includes(s)) return 1;
  if (['no', '0', 'false', 'off', 'n'].includes(s)) return 0;
  return null;
}

function toPositiveInt(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function toNumberOrNull(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isDuplicateError(err) {
  const number = Number(
    err?.number ??
      err?.originalError?.info?.number ??
      err?.precedingErrors?.[0]?.number ??
      NaN
  );
  const msg = String(err?.message || err || '').toLowerCase();

  return (
    number === 2601 ||
    number === 2627 ||
    msg.includes('duplicate') ||
    msg.includes('duplicado') ||
    msg.includes('unique')
  );
}

function sanitizeUser(row) {
  const userId = toPositiveInt(row?.UserId ?? row?.userId);
  const idClinica = toNumberOrNull(row?.IdClinica ?? row?.idClinica);

  const rawIsActive = row?.IsActive ?? row?.isActive;
  const bit = toBit(rawIsActive);

  return {
    userId,
    username: toText(row?.Username ?? row?.username),
    fullName: toText(row?.FullName ?? row?.fullName),
    idClinica,
    isActive: bit === null ? null : bit === 1
  };
}

async function getUserById(req, userId) {
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
        IdClinica,
        IsActive
      FROM dbo.Users
      WHERE UserId = @UserId
      `
    );

  return r.recordset?.[0] || null;
}

/** GET /api/users?take=100 */
async function list(req, res) {
  try {
    const take = Math.min(200, Math.max(1, Number(req.query.take || 100)));
    const r = await req.db
      .request()
      .input('Take', req.sql.Int, take)
      .query(
        `
        SELECT TOP (@Take)
          UserId,
          Username,
          FullName,
          IdClinica,
          IsActive
        FROM dbo.Users
        ORDER BY UserId DESC
        `
      );

    return res.json((r.recordset || []).map((x) => sanitizeUser(x)));
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Error' });
  }
}
/*
Request example:
GET /api/users?take=50

Response example (200):
[
  {
    "userId": 10,
    "username": "admin",
    "fullName": "Administrador",
    "idClinica": 1,
    "isActive": true
  }
]
*/

/** POST /api/users */
async function create(req, res) {
  try {
    const b = req.body || {};

    const username = toText(b.username);
    const password = b.password === null || b.password === undefined ? '' : String(b.password);
    const fullName = toText(b.fullName);
    const idClinica = parseNullablePositiveInt(b.idClinica);
    const isActive = toBit(hasOwn(b, 'isActive') ? b.isActive : true);

    if (!username) return res.status(400).json({ message: 'username requerido' });
    if (!password.trim()) return res.status(400).json({ message: 'password requerido' });
    if (!fullName) return res.status(400).json({ message: 'fullName requerido' });
    if (idClinica === INVALID_NUMBER) {
      return res.status(400).json({ message: 'idClinica debe ser entero positivo o null' });
    }
    if (isActive === null) return res.status(400).json({ message: 'isActive invalido' });

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const r = await req.db
      .request()
      .input('Username', req.sql.NVarChar(60), username)
      .input('PasswordHash', req.sql.NVarChar(255), passwordHash)
      .input('FullName', req.sql.NVarChar(150), fullName)
      .input('IdClinica', req.sql.Int, idClinica)
      .input('IsActive', req.sql.Bit, isActive)
      .execute('spUsers_Create');

    const out = r.recordset?.[0];
    if (out?.ErrorMessage) {
      if (isDuplicateError(out.ErrorMessage)) {
        return res.status(409).json({ message: out.ErrorMessage });
      }
      return res.status(400).json({ message: out.ErrorMessage });
    }

    const row = out || {
      UserId: null,
      Username: username,
      FullName: fullName,
      IdClinica: idClinica,
      IsActive: isActive
    };

    return res.status(201).json(sanitizeUser(row));
  } catch (err) {
    if (isDuplicateError(err)) {
      return res.status(409).json({ message: 'Usuario duplicado' });
    }

    return res.status(500).json({ message: err.message || 'Error' });
  }
}
/*
Request example:
POST /api/users
{
  "username": "admin",
  "password": "123456",
  "fullName": "Administrador",
  "idClinica": 1,
  "isActive": true
}

Response example (201):
{
  "userId": 10,
  "username": "admin",
  "fullName": "Administrador",
  "idClinica": 1,
  "isActive": true
}
*/

/** PUT /api/users/:id */
async function update(req, res) {
  try {
    const userId = toPositiveInt(req.params.id);
    if (!userId) return res.status(400).json({ message: 'id invalido' });

    const b = req.body || {};
    const hasUpdatableField =
      hasOwn(b, 'username') ||
      hasOwn(b, 'password') ||
      hasOwn(b, 'fullName') ||
      hasOwn(b, 'idClinica') ||
      hasOwn(b, 'isActive');

    if (!hasUpdatableField) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    const current = await getUserById(req, userId);
    if (!current) return res.status(404).json({ message: 'No encontrado' });

    const username = hasOwn(b, 'username') ? toText(b.username) : toText(current.Username);
    if (!username) return res.status(400).json({ message: 'username invalido' });

    const fullName = hasOwn(b, 'fullName') ? toText(b.fullName) : toText(current.FullName);
    if (!fullName) return res.status(400).json({ message: 'fullName invalido' });

    const currentIdClinica = parseNullablePositiveInt(current.IdClinica);
    let idClinica = hasOwn(b, 'idClinica')
      ? parseNullablePositiveInt(b.idClinica)
      : currentIdClinica === INVALID_NUMBER
        ? null
        : currentIdClinica;
    if (idClinica === INVALID_NUMBER) {
      return res.status(400).json({ message: 'idClinica debe ser entero positivo o null' });
    }

    const isActive = hasOwn(b, 'isActive') ? toBit(b.isActive) : toBit(current.IsActive);
    if (isActive === null) return res.status(400).json({ message: 'isActive invalido' });

    let passwordHash = current.PasswordHash;
    if (hasOwn(b, 'password')) {
      const password = b.password === null || b.password === undefined ? '' : String(b.password);
      if (!password.trim()) return res.status(400).json({ message: 'password invalido' });
      passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    const r = await req.db
      .request()
      .input('UserId', req.sql.Int, userId)
      .input('Username', req.sql.NVarChar(60), username)
      .input('PasswordHash', req.sql.NVarChar(255), passwordHash)
      .input('FullName', req.sql.NVarChar(150), fullName)
      .input('IdClinica', req.sql.Int, idClinica)
      .input('IsActive', req.sql.Bit, isActive)
      .execute('spUsers_Update');

    const out = r.recordset?.[0];
    if (out?.ErrorMessage) {
      if (isDuplicateError(out.ErrorMessage)) {
        return res.status(409).json({ message: out.ErrorMessage });
      }
      return res.status(400).json({ message: out.ErrorMessage });
    }

    const row = out || {
      UserId: userId,
      Username: username,
      FullName: fullName,
      IdClinica: idClinica,
      IsActive: isActive
    };

    return res.json(sanitizeUser(row));
  } catch (err) {
    if (isDuplicateError(err)) {
      return res.status(409).json({ message: 'Usuario duplicado' });
    }

    return res.status(500).json({ message: err.message || 'Error' });
  }
}
/*
Request example:
PUT /api/users/10
{
  "fullName": "Admin Principal",
  "idClinica": 2
}

Response example (200):
{
  "userId": 10,
  "username": "admin",
  "fullName": "Admin Principal",
  "idClinica": 2,
  "isActive": true
}
*/

module.exports = { create, list, update };
