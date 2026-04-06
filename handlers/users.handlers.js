const bcrypt = require('bcryptjs');

const INVALID_NUMBER = Symbol('invalid_number');
const INVALID_VALUE = Symbol('invalid_value');
const BCRYPT_ROUNDS_RAW = Number(process.env.BCRYPT_ROUNDS || 10);
const BCRYPT_ROUNDS =
  Number.isInteger(BCRYPT_ROUNDS_RAW) && BCRYPT_ROUNDS_RAW > 3 ? BCRYPT_ROUNDS_RAW : 10;
const ALLOWED_ROLES = ['SuperAdmin', 'Administrador', 'Empleado'];

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
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

function normalizeRole(v) {
  const role = toText(v);
  if (!role) return null;

  const canonical = ALLOWED_ROLES.find((x) => x.toLowerCase() === role.toLowerCase());
  return canonical || INVALID_VALUE;
}

function parseClinicIdsInput(input) {
  if (input === undefined) {
    return { provided: false, ids: [], csv: null };
  }

  if (input === null) {
    return { provided: true, ids: [], csv: '' };
  }

  let values = [];
  if (Array.isArray(input)) {
    values = input;
  } else if (typeof input === 'number') {
    values = [input];
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return { provided: true, ids: [], csv: '' };
    values = trimmed.split(',');
  } else {
    return { provided: true, error: 'idClinicas debe ser arreglo, string CSV, numero o null' };
  }

  const dedupe = new Set();
  const ids = [];

  for (const raw of values) {
    if (raw === null || raw === undefined || String(raw).trim() === '') continue;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1) {
      return { provided: true, error: 'idClinicas debe contener enteros positivos' };
    }
    if (!dedupe.has(n)) {
      dedupe.add(n);
      ids.push(n);
    }
  }

  return {
    provided: true,
    ids,
    csv: ids.length ? ids.join(',') : ''
  };
}

function getSqlErrorNumber(err) {
  return Number(
    err?.number ??
      err?.originalError?.info?.number ??
      err?.precedingErrors?.[0]?.number ??
      NaN
  );
}

function isDuplicateError(err) {
  const number = getSqlErrorNumber(err);
  const msg = String(err?.message || err || '').toLowerCase();

  return (
    number === 2601 ||
    number === 2627 ||
    number === 50001 ||
    number === 50003 ||
    msg.includes('duplicate') ||
    msg.includes('duplicado') ||
    msg.includes('unique') ||
    msg.includes('ya existe')
  );
}

function parseAssignedClinic(row) {
  const clinicId = toPositiveInt(row?.ClinicId ?? row?.AssignedClinicId ?? row?.clinicId);
  if (!clinicId) return null;

  return {
    clinicId,
    codigo: toText(row?.Codigo ?? row?.AssignedClinicCodigo ?? row?.codigo),
    nombre: toText(row?.Nombre ?? row?.AssignedClinicNombre ?? row?.nombre),
    telefono: toText(row?.Telefono ?? row?.AssignedClinicTelefono ?? row?.telefono)
  };
}

async function getUserRowById(req, userId) {
  const id = toPositiveInt(userId);
  if (!id) return null;

  const r = await req.db
    .request()
    .input('UserId', req.sql.Int, id)
    .query(
      `
      SELECT TOP (1)
        UserId,
        Username,
        FullName,
        Rol,
        IdClinica,
        IsActive,
        ChangePassword,
        CreatedAt
      FROM dbo.Users
      WHERE UserId = @UserId
      `
    );

  return r.recordset?.[0] || null;
}

function sanitizeUser(row, clinicsRows) {
  const idClinica = toNumberOrNull(row?.IdClinica ?? row?.idClinica);
  const assignedClinics = [];
  const seen = new Set();

  for (const cRow of clinicsRows || []) {
    const clinic = parseAssignedClinic(cRow);
    if (!clinic) continue;
    if (seen.has(clinic.clinicId)) continue;
    seen.add(clinic.clinicId);
    assignedClinics.push(clinic);
  }

  let idClinicas = assignedClinics.map((x) => x.clinicId);
  if (idClinicas.length === 0 && idClinica !== null && toPositiveInt(idClinica)) {
    idClinicas = [Number(idClinica)];
  }

  const bit = toBit(row?.IsActive ?? row?.isActive);
  const changePasswordBit = toBit(row?.ChangePassword ?? row?.changePassword);

  return {
    userId: toPositiveInt(row?.UserId ?? row?.userId),
    username: toText(row?.Username ?? row?.username),
    fullName: toText(row?.FullName ?? row?.fullName),
    rol: toText(row?.Rol ?? row?.rol),
    idClinica,
    idClinicas,
    clinics: assignedClinics,
    isActive: bit === null ? null : bit === 1,
    changePassword: changePasswordBit === 1,
    createdAt: row?.CreatedAt ?? row?.createdAt ?? null
  };
}

function mapSpError(res, err) {
  const number = getSqlErrorNumber(err);
  const message = String(err?.message || 'Error');
  const lower = message.toLowerCase();

  if (isDuplicateError(err)) {
    return res.status(409).json({ message });
  }

  if (number === 50002 && lower.includes('usuario no existe')) {
    return res.status(404).json({ message });
  }

  if (number === 50000 || number === 50002 || number === 50004) {
    return res.status(400).json({ message });
  }

  if (number === 245 || number === 8114) {
    return res.status(400).json({ message: 'Datos invalidos para usuario' });
  }

  return res.status(500).json({ message: err?.message || 'Error' });
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
          u.UserId,
          u.Username,
          u.FullName,
          u.Rol,
          u.IdClinica,
          u.IsActive,
          u.ChangePassword,
          u.CreatedAt,
          uc.ClinicId AS AssignedClinicId,
          c.Codigo AS AssignedClinicCodigo,
          c.Nombre AS AssignedClinicNombre,
          c.Telefono AS AssignedClinicTelefono
        FROM dbo.Users u
        LEFT JOIN dbo.UserClinics uc
          ON uc.UserId = u.UserId
        LEFT JOIN dbo.Clinics c
          ON c.ClinicId = uc.ClinicId
        ORDER BY u.UserId DESC, uc.ClinicId ASC
        `
      );

    const map = new Map();
    for (const row of r.recordset || []) {
      const userId = toPositiveInt(row.UserId);
      if (!userId) continue;

      if (!map.has(userId)) {
        const bit = toBit(row?.IsActive ?? row?.isActive);
        const changePasswordBit = toBit(row?.ChangePassword ?? row?.changePassword);
        map.set(userId, {
          userId,
          username: toText(row?.Username ?? row?.username),
          fullName: toText(row?.FullName ?? row?.fullName),
          rol: toText(row?.Rol ?? row?.rol),
          idClinica: toNumberOrNull(row?.IdClinica ?? row?.idClinica),
          idClinicas: [],
          clinics: [],
          isActive: bit === null ? null : bit === 1,
          changePassword: changePasswordBit === 1,
          createdAt: row?.CreatedAt ?? row?.createdAt ?? null
        });
      }

      const target = map.get(userId);
      const clinic = parseAssignedClinic(row);
      if (!clinic) continue;

      if (!target.idClinicas.includes(clinic.clinicId)) {
        target.idClinicas.push(clinic.clinicId);
      }
      if (!target.clinics.some((x) => x.clinicId === clinic.clinicId)) {
        target.clinics.push(clinic);
      }
    }

    const users = Array.from(map.values()).map((x) => {
      if (x.idClinicas.length === 0 && x.idClinica !== null && toPositiveInt(x.idClinica)) {
        x.idClinicas = [Number(x.idClinica)];
      }
      return x;
    });

    return res.json(users);
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
    "rol": "Administrador",
    "idClinica": 1,
    "idClinicas": [1, 2],
    "clinics": [
      { "clinicId": 1, "codigo": "CLN-001", "nombre": "Clinica Central", "telefono": "5555-0101" },
      { "clinicId": 2, "codigo": "CLN-002", "nombre": "Clinica Norte", "telefono": "5555-0102" }
    ],
    "isActive": true,
    "createdAt": "2026-02-26T09:00:00.000Z"
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
    const rol = normalizeRole(b.rol);
    const isActive = toBit(hasOwn(b, 'isActive') ? b.isActive : true);

    const clinicsInput = hasOwn(b, 'idClinicas')
      ? b.idClinicas
      : hasOwn(b, 'idClinica')
        ? b.idClinica
        : undefined;
    const parsedClinics = parseClinicIdsInput(clinicsInput);

    if (!username) return res.status(400).json({ message: 'username requerido' });
    if (!password.trim()) return res.status(400).json({ message: 'password requerido' });
    if (!fullName) return res.status(400).json({ message: 'fullName requerido' });
    if (rol === null || rol === INVALID_VALUE) {
      return res.status(400).json({
        message: 'rol invalido. Valores permitidos: SuperAdmin, Administrador, Empleado'
      });
    }
    if (isActive === null) return res.status(400).json({ message: 'isActive invalido' });
    if (parsedClinics.error) return res.status(400).json({ message: parsedClinics.error });

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const r = await req.db
      .request()
      .input('Username', req.sql.NVarChar(60), username)
      .input('PasswordHash', req.sql.NVarChar(255), passwordHash)
      .input('FullName', req.sql.NVarChar(120), fullName)
      .input('Rol', req.sql.NVarChar(20), rol)
      .input('IdClinicas', req.sql.NVarChar(req.sql.MAX), parsedClinics.csv)
      .input('IsActive', req.sql.Bit, isActive)
      .execute('spUsers_Create');

    const userRow = r.recordsets?.[0]?.[0] || r.recordset?.[0] || null;
    const clinicsRows = r.recordsets?.[1] || [];
    const createdUserId = toPositiveInt(userRow?.UserId ?? userRow?.userId);
    const hydratedUserRow =
      createdUserId && userRow?.ChangePassword === undefined && userRow?.changePassword === undefined
        ? (await getUserRowById(req, createdUserId)) || userRow
        : userRow;

    if (userRow?.ErrorMessage) {
      if (isDuplicateError(userRow.ErrorMessage)) {
        return res.status(409).json({ message: userRow.ErrorMessage });
      }
      return res.status(400).json({ message: userRow.ErrorMessage });
    }

    return res.status(201).json(
      sanitizeUser(
        hydratedUserRow || {
          UserId: null,
          Username: username,
          FullName: fullName,
          Rol: rol,
          IdClinica: parsedClinics.ids?.[0] || null,
          IsActive: isActive
        },
        clinicsRows
      )
    );
  } catch (err) {
    return mapSpError(res, err);
  }
}
/*
Request example:
POST /api/users
{
  "username": "admin",
  "password": "123456",
  "fullName": "Administrador",
  "rol": "Administrador",
  "idClinicas": [1, 2],
  "isActive": true
}

Response example (201):
{
  "userId": 10,
  "username": "admin",
  "fullName": "Administrador",
  "rol": "Administrador",
  "idClinica": 1,
  "idClinicas": [1, 2],
  "clinics": [
    { "clinicId": 1, "codigo": "CLN-001", "nombre": "Clinica Central", "telefono": "5555-0101" },
    { "clinicId": 2, "codigo": "CLN-002", "nombre": "Clinica Norte", "telefono": "5555-0102" }
  ],
  "isActive": true,
  "createdAt": "2026-02-26T09:00:00.000Z"
}
*/

/** PUT /api/users/:id */
async function update(req, res) {
  try {
    const userId = toPositiveInt(req.params.id);
    if (!userId) return res.status(400).json({ message: 'id invalido' });

    const b = req.body || {};
    const clinicsInput = hasOwn(b, 'idClinicas')
      ? b.idClinicas
      : hasOwn(b, 'idClinica')
        ? b.idClinica
        : undefined;

    const hasUpdatableField =
      hasOwn(b, 'username') ||
      hasOwn(b, 'password') ||
      hasOwn(b, 'fullName') ||
      hasOwn(b, 'rol') ||
      hasOwn(b, 'idClinicas') ||
      hasOwn(b, 'idClinica') ||
      hasOwn(b, 'isActive') ||
      hasOwn(b, 'changePassword');

    if (!hasUpdatableField) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    const username = hasOwn(b, 'username') ? toText(b.username) : null;
    const fullName = hasOwn(b, 'fullName') ? toText(b.fullName) : null;
    const rol = hasOwn(b, 'rol') ? normalizeRole(b.rol) : null;
    const isActive = hasOwn(b, 'isActive') ? toBit(b.isActive) : null;
    const changePassword = hasOwn(b, 'changePassword') ? toBit(b.changePassword) : null;
    const parsedClinics = parseClinicIdsInput(clinicsInput);

    if (hasOwn(b, 'username') && !username) {
      return res.status(400).json({ message: 'username invalido' });
    }
    if (hasOwn(b, 'fullName') && !fullName) {
      return res.status(400).json({ message: 'fullName invalido' });
    }
    if (rol === INVALID_VALUE) {
      return res.status(400).json({
        message: 'rol invalido. Valores permitidos: SuperAdmin, Administrador, Empleado'
      });
    }
    if (hasOwn(b, 'isActive') && isActive === null) {
      return res.status(400).json({ message: 'isActive invalido' });
    }
    if (hasOwn(b, 'changePassword') && changePassword === null) {
      return res.status(400).json({ message: 'changePassword invalido' });
    }
    if (parsedClinics.error) return res.status(400).json({ message: parsedClinics.error });

    let passwordHash = null;
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
      .input('FullName', req.sql.NVarChar(120), fullName)
      .input('Rol', req.sql.NVarChar(20), rol)
      .input(
        'IdClinicas',
        req.sql.NVarChar(req.sql.MAX),
        parsedClinics.provided ? parsedClinics.csv : null
      )
      .input('IsActive', req.sql.Bit, isActive)
      .input('ChangePassword', req.sql.Bit, changePassword)
      .execute('spUsers_Update');

    const userRow = r.recordsets?.[0]?.[0] || r.recordset?.[0] || null;
    const clinicsRows = r.recordsets?.[1] || [];
    const hydratedUserRow =
      userId && userRow?.ChangePassword === undefined && userRow?.changePassword === undefined
        ? (await getUserRowById(req, userId)) || userRow
        : userRow;

    if (!userRow) {
      return res.status(500).json({ message: 'No se obtuvo respuesta del usuario actualizado' });
    }

    if (userRow?.ErrorMessage) {
      if (isDuplicateError(userRow.ErrorMessage)) {
        return res.status(409).json({ message: userRow.ErrorMessage });
      }
      return res.status(400).json({ message: userRow.ErrorMessage });
    }

    return res.json(sanitizeUser(hydratedUserRow, clinicsRows));
  } catch (err) {
    return mapSpError(res, err);
  }
}
/*
Request example:
PUT /api/users/10
{
  "rol": "Empleado",
  "idClinicas": [2, 5],
  "isActive": true
}

Response example (200):
{
  "userId": 10,
  "username": "admin",
  "fullName": "Administrador",
  "rol": "Empleado",
  "idClinica": 2,
  "idClinicas": [2, 5],
  "clinics": [
    { "clinicId": 2, "codigo": "CLN-002", "nombre": "Clinica Norte", "telefono": "5555-0102" },
    { "clinicId": 5, "codigo": "CLN-005", "nombre": "Clinica Sur", "telefono": "5555-0105" }
  ],
  "isActive": true,
  "createdAt": "2026-02-26T09:00:00.000Z"
}
*/

module.exports = { create, list, update };
