/**
 * GET /api/dashboard/summary
 *
 * recordsets:
 *  0: KPIs
 *  1: pending list
 */
const INVALID_NUMBER = Symbol('invalid_number');

function formatDateDDMMYYYY(value){
  if(value === null || value === undefined || value === '') return null;

  if(value instanceof Date && !Number.isNaN(value.getTime())){
    const dd = String(value.getUTCDate()).padStart(2, '0');
    const mm = String(value.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = String(value.getUTCFullYear());
    return `${dd}-${mm}-${yyyy}`;
  }

  const raw = String(value).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){
    const [yyyy, mm, dd] = raw.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }

  const parsed = new Date(raw);
  if(Number.isNaN(parsed.getTime())) return raw;

  const dd = String(parsed.getUTCDate()).padStart(2, '0');
  const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = String(parsed.getUTCFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

function normalizeRoleForSp(value){
  const raw = String(value ?? '').trim();
  const lower = raw.toLowerCase();

  if(lower === 'superadmin') return 'SuperAdmin'; 
  if(lower === 'administrador') return 'Administrador';
  if(lower === 'empleado') return 'Empleado';
  return raw;
}

function parseClinicScopeId(value){
  if(value === null || value === undefined || String(value).trim() === '') return 0;
  const n = Number(value);
  if(!Number.isInteger(n) || n < 0) return INVALID_NUMBER;
  return n;
}

function resolveClinicScopeId(req){
  const queryClinicId = req.query?.idClinica ?? req.query?.clinicId;
  if(queryClinicId !== undefined){
    return parseClinicScopeId(queryClinicId);
  }

  const headerClinicId = req.headers?.['x-clinic-id'];
  if(headerClinicId !== undefined){
    return parseClinicScopeId(headerClinicId);
  }

  const userClinicId = req.user?.idClinica ?? req.user?.clinicId;
  if(userClinicId !== undefined && userClinicId !== null){
    return parseClinicScopeId(userClinicId);
  }

  return 0;
}

function getSqlErrorNumber(err){
  return Number(
    err?.number ??
      err?.originalError?.info?.number ??
      err?.precedingErrors?.[0]?.number ??
      NaN
  );
}

async function summary(req, res){
  try{
    const rol = normalizeRoleForSp(req.user?.rol ?? req.user?.role);
    const userId = Number(req.user?.userId);
    console.log('BODY:: ', req.user);
    const idClinicScope = resolveClinicScopeId(req);

    if(idClinicScope === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const isSuperAdmin = rol === 'SuperAdmin';
    const idClinic = isSuperAdmin ? null : idClinicScope;
    const userIdParam = Number.isInteger(userId) && userId > 0 ? userId : null;

    const r = await req.db.request()
      .input('Rol', req.sql.NVarChar(20), rol)
      .input('UserId', req.sql.Int, userIdParam)
      .input('IdClinic', req.sql.Int, idClinic)
      .execute('spDashboard_Summary');

    const k = r.recordsets?.[0]?.[0] || {};
    const pending = r.recordsets?.[1] || [];

    return res.json({
      kpis: {
        totalPatients: k.TotalPatients ?? 0,
        pendingDeliveries: k.PendingDeliveries ?? 0,
        pendingBalance: Number(k.PendingBalance ?? 0),
        idClinica: k.IdClinica ?? null,
        codigoClinica: k.CodClinica ?? k.CodigoClinica ?? null,
        nombreClinica: k.NombreClinica ?? null
      },
      pending: pending.map(x=>({
        patientId: x.PatientId,
        orderNo: x.OrderNo,
        examDate: formatDateDDMMYYYY(x.ExamDate),
        name: x.Name,
        phone: x.Phone,
        balance: Number(x.Balance ?? 0),
        labCode: x.LabCode,
        idClinica: x.IdClinica ?? null,
        codigoClinica: x.CodClinica ?? x.CodigoClinica ?? null,
        nombreClinica: x.NombreClinica ?? null
      }))
    });
  }catch(err){
    const number = getSqlErrorNumber(err);
    if(number === 50040 || number === 50041){
      return res.status(400).json({ message: err.message || 'Parametros invalidos para dashboard.' });
    }
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

module.exports = { summary };
