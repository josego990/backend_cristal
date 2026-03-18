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

function isDuplicateError(err) {
  const number = Number(
    err?.number ??
      err?.originalError?.info?.number ??
      err?.precedingErrors?.[0]?.number ??
      NaN
  );
  const msg = String(err?.message || err || '').toLowerCase();

  return (
    number === 50100 ||
    number === 50102 ||
    number === 2601 ||
    number === 2627 ||
    msg.includes('ya existe') ||
    msg.includes('duplicate') ||
    msg.includes('duplicado') ||
    msg.includes('unique')
  );
}

function sanitizeClinic(row) {
  return {
    clinicId: Number(row?.ClinicId ?? row?.clinicId ?? 0) || null,
    codigo: toText(row?.Codigo ?? row?.codigo),
    nombre: toText(row?.Nombre ?? row?.nombre),
    logo: toText(row?.Logo ?? row?.logo),
    estado: toBit(row?.Estado ?? row?.estado) === 1,
    createdAt: row?.CreatedAt ?? row?.createdAt ?? null,
    updatedAt: row?.UpdatedAt ?? row?.updatedAt ?? null
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

/** POST /api/clinics */
async function create(req, res) {
  try {
    const b = req.body || {};

    const codigo = toText(b.codigo);
    const nombre = toText(b.nombre);
    const logo = toText(b.logo);
    const estado = hasOwn(b, 'estado') ? toBit(b.estado) : 1;

    if (!codigo) return res.status(400).json({ message: 'codigo requerido' });
    if (!nombre) return res.status(400).json({ message: 'nombre requerido' });
    if (estado === null) return res.status(400).json({ message: 'estado invalido' });

    const r = await req.db
      .request()
      .input('Codigo', req.sql.NVarChar(50), codigo)
      .input('Nombre', req.sql.NVarChar(150), nombre)
      .input('Logo', req.sql.NVarChar(req.sql.MAX), logo)
      .input('Estado', req.sql.Bit, estado)
      .execute('spClinics_Create');

    const row = {
      ClinicId: null,
      Codigo: codigo,
      Nombre: nombre,
      Logo: logo,
      Estado: estado,
      CreatedAt: null,
      UpdatedAt: null
    };

    Object.assign(row, r.recordset?.[0] || {});

    return res.status(201).json(sanitizeClinic(row));
  } catch (err) {
    if (isDuplicateError(err)) {
      return res.status(409).json({ message: err.message || 'Codigo de clinica duplicado' });
    }

    const number = Number(
      err?.number ??
        err?.originalError?.info?.number ??
        err?.precedingErrors?.[0]?.number ??
        NaN
    );
    if (Number.isFinite(number) && number >= 50000 && number < 60000) {
      return res.status(400).json({ message: err.message || 'Error de validacion' });
    }

    return res.status(500).json({ message: err.message || 'Error' });
  }
}
/*
Request example:
POST /api/clinics
{
  "codigo": "CLN-001",
  "nombre": "Clinica Central",
  "logo": "data:image/png;base64,...",
  "estado": true
}

Response example (201):
{
  "clinicId": 1,
  "codigo": "CLN-001",
  "nombre": "Clinica Central",
  "logo": "data:image/png;base64,...",
  "estado": true,
  "createdAt": "2026-02-23T20:10:00.000Z",
  "updatedAt": null
}
*/

/** GET /api/clinics?take=100 */
async function list(req, res) {
  try {
    const take = Math.min(200, Math.max(1, Number(req.query.take || 100)));
    const r = await req.db
      .request()
      .input('Take', req.sql.Int, take)
      .query(
        `
        SELECT TOP (@Take)
          ClinicId,
          Codigo,
          Nombre,
          Logo,
          Estado,
          CreatedAt,
          UpdatedAt
        FROM dbo.Clinics
        ORDER BY ClinicId DESC
        `
      );

    return res.json((r.recordset || []).map((x) => sanitizeClinic(x)));
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Error' });
  }
}
/*
Request example:
GET /api/clinics?take=50

Response example (200):
[
  {
    "clinicId": 1,
    "codigo": "CLN-001",
    "nombre": "Clinica Central",
    "logo": "data:image/png;base64,...",
    "estado": true,
    "createdAt": "2026-02-23T20:10:00.000Z",
    "updatedAt": null
  }
]
*/

/** PUT /api/clinics/:id */
async function update(req, res) {
  try {
    const clinicId = toPositiveInt(req.params.id);
    if (!clinicId) return res.status(400).json({ message: 'id invalido' });

    const b = req.body || {};
    const hasCodigo = hasOwn(b, 'codigo');
    const hasNombre = hasOwn(b, 'nombre');
    const hasLogo = hasOwn(b, 'logo');
    const hasEstado = hasOwn(b, 'estado');

    if (!hasCodigo && !hasNombre && !hasLogo && !hasEstado) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    const currentResult = await req.db
      .request()
      .input('ClinicId', req.sql.Int, clinicId)
      .query(
        `
        SELECT TOP (1)
          ClinicId,
          Codigo,
          Nombre,
          Logo,
          Estado,
          CreatedAt,
          UpdatedAt
        FROM dbo.Clinics
        WHERE ClinicId = @ClinicId
        `
      );

    const current = currentResult.recordset?.[0];
    if (!current) return res.status(404).json({ message: 'No encontrado' });

    const codigo = hasCodigo ? toText(b.codigo) : toText(current.Codigo);
    const nombre = hasNombre ? toText(b.nombre) : toText(current.Nombre);
    const logo = hasLogo ? toText(b.logo) : toText(current.Logo);
    const estado = hasEstado ? toBit(b.estado) : toBit(current.Estado);

    if (!codigo) return res.status(400).json({ message: 'codigo requerido' });
    if (!nombre) return res.status(400).json({ message: 'nombre requerido' });
    if (estado === null) return res.status(400).json({ message: 'estado invalido' });

    const r = await req.db
      .request()
      .input('ClinicId', req.sql.Int, clinicId)
      .input('Codigo', req.sql.NVarChar(50), codigo)
      .input('Nombre', req.sql.NVarChar(150), nombre)
      .input('Estado', req.sql.Bit, estado)
      .input('Logo', req.sql.NVarChar(req.sql.MAX), logo)
      .execute('spClinics_Update');

    const row = {
      ClinicId: clinicId,
      Codigo: codigo,
      Nombre: nombre,
      Logo: logo,
      Estado: estado,
      CreatedAt: current.CreatedAt,
      UpdatedAt: current.UpdatedAt
    };

    Object.assign(row, r.recordset?.[0] || {});

    return res.json(sanitizeClinic(row));
  } catch (err) {
    const number = getSqlErrorNumber(err);

    if (number === 50101) {
      return res.status(404).json({ message: err.message || 'La clinica no existe.' });
    }
    if (isDuplicateError(err)) {
      return res.status(409).json({ message: err.message || 'Codigo de clinica duplicado' });
    }
    if (Number.isFinite(number) && number >= 50000 && number < 60000) {
      return res.status(400).json({ message: err.message || 'Error de validacion' });
    }

    return res.status(500).json({ message: err.message || 'Error' });
  }
}
/*
Request example:
PUT /api/clinics/1
{
  "nombre": "Clinica Central Actualizada",
  "estado": false
}

Response example (200):
{
  "clinicId": 1,
  "codigo": "CLN-001",
  "nombre": "Clinica Central Actualizada",
  "logo": "data:image/png;base64,...",
  "estado": false,
  "createdAt": "2026-02-23T20:10:00.000Z",
  "updatedAt": "2026-03-18T20:10:00.000Z"
}
*/

/** GET /api/clinics/user/:userId */
async function listByUserId(req, res) {
  try {
    const userId = toPositiveInt(req.params.userId);
    if (!userId) return res.status(400).json({ message: 'userId invalido' });

    const userCheck = await req.db
      .request()
      .input('UserId', req.sql.Int, userId)
      .query(
        `
        SELECT TOP (1) UserId
        FROM dbo.Users
        WHERE UserId = @UserId
        `
      );

    if (!userCheck.recordset?.[0]) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const r = await req.db
      .request()
      .input('UserId', req.sql.Int, userId)
      .query(
        `
        ;WITH assigned AS (
          SELECT uc.ClinicId
          FROM dbo.UserClinics uc
          WHERE uc.UserId = @UserId
        ),
        fallbackPrimary AS (
          SELECT u.IdClinica AS ClinicId
          FROM dbo.Users u
          WHERE u.UserId = @UserId
            AND u.IdClinica IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM assigned)
        ),
        clinicIds AS (
          SELECT ClinicId FROM assigned
          UNION
          SELECT ClinicId FROM fallbackPrimary
        )
        SELECT
          c.ClinicId,
          c.Codigo,
          c.Nombre,
          c.Logo,
          c.Estado,
          c.CreatedAt,
          c.UpdatedAt
        FROM clinicIds ids
        INNER JOIN dbo.Clinics c
          ON c.ClinicId = ids.ClinicId
        ORDER BY c.ClinicId
        `
      );

    return res.json((r.recordset || []).map((x) => sanitizeClinic(x)));
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Error' });
  }
}
/*
Request example:
GET /api/clinics/user/10
Authorization: Bearer <token>

Response example (200):
[
  {
    "clinicId": 1,
    "codigo": "CLN-001",
    "nombre": "Clinica Central",
    "logo": "data:image/png;base64,...",
    "estado": true,
    "createdAt": "2026-02-23T20:10:00.000Z",
    "updatedAt": null
  }
]
*/

module.exports = { create, list, update, listByUserId };
