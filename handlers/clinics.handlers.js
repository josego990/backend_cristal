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
    estado: toBit(row?.Estado ?? row?.estado) === 1,
    createdAt: row?.CreatedAt ?? row?.createdAt ?? null,
    updatedAt: row?.UpdatedAt ?? row?.updatedAt ?? null
  };
}

/** POST /api/clinics */
async function create(req, res) {
  try {
    const b = req.body || {};

    const codigo = toText(b.codigo);
    const nombre = toText(b.nombre);
    const estado = hasOwn(b, 'estado') ? toBit(b.estado) : 1;

    if (!codigo) return res.status(400).json({ message: 'codigo requerido' });
    if (!nombre) return res.status(400).json({ message: 'nombre requerido' });
    if (estado === null) return res.status(400).json({ message: 'estado invalido' });

    const r = await req.db
      .request()
      .input('Codigo', req.sql.NVarChar(50), codigo)
      .input('Nombre', req.sql.NVarChar(150), nombre)
      .input('Estado', req.sql.Bit, estado)
      .execute('spClinics_Create');

    const row = r.recordset?.[0] || {
      ClinicId: null,
      Codigo: codigo,
      Nombre: nombre,
      Estado: estado,
      CreatedAt: null,
      UpdatedAt: null
    };

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
  "estado": true
}

Response example (201):
{
  "clinicId": 1,
  "codigo": "CLN-001",
  "nombre": "Clinica Central",
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
    "estado": true,
    "createdAt": "2026-02-23T20:10:00.000Z",
    "updatedAt": null
  }
]
*/

module.exports = { create, list };
