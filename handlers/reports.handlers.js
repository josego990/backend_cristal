const { executeReportProcedure } = require('../db/reports.db');

const INVALID_NUMBER = Symbol('invalid_number');
const INVALID_DATE = Symbol('invalid_date');
const INVALID_TEXT = Symbol('invalid_text');
const VALID_ROLES = new Set(['SuperAdmin', 'Administrador', 'Empleado']);

function normalizeRoleForSp(value){
  const raw = String(value ?? '').trim();
  const lower = raw.toLowerCase();

  if(lower === 'superadmin') return 'SuperAdmin';
  if(lower === 'administrador') return 'Administrador';
  if(lower === 'empleado') return 'Empleado';
  return raw;
}

function parsePositiveInt(value){
  if(value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(value);
  if(!Number.isInteger(n) || n < 1) return INVALID_NUMBER;
  return n;
}

function parseNonNegativeInt(value){
  if(value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(value);
  if(!Number.isInteger(n) || n < 0) return INVALID_NUMBER;
  return n;
}

function parseOptionalText(value, { maxLength = null } = {}){
  if(value === null || value === undefined) return null;

  const text = String(value).trim();
  if(!text) return null;
  if(maxLength !== null && text.length > maxLength) return INVALID_TEXT;

  return text;
}

function toDateOnlyValue(date){
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateOnly(value){
  if(value === null || value === undefined || String(value).trim() === '') return null;

  const raw = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if(!match) return INVALID_DATE;

  const yyyy = Number(match[1]);
  const mm = Number(match[2]);
  const dd = Number(match[3]);

  const date = new Date(yyyy, mm - 1, dd);
  if(
    date.getFullYear() !== yyyy ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ){
    return INVALID_DATE;
  }

  return raw;
}

function fromDateOnlyValue(value){
  const [yyyy, mm, dd] = String(value).split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
}

function getDefaultDateRange(){
  const dateTo = new Date();
  const dateFrom = new Date(dateTo);
  dateFrom.setDate(dateFrom.getDate() - 29);

  return {
    dateFrom: toDateOnlyValue(dateFrom),
    dateTo: toDateOnlyValue(dateTo)
  };
}

function resolveDateRange(query){
  const parsedDateFrom = parseDateOnly(query?.dateFrom);
  const parsedDateTo = parseDateOnly(query?.dateTo);

  if(parsedDateFrom === INVALID_DATE || parsedDateTo === INVALID_DATE){
    return INVALID_DATE;
  }

  if(parsedDateFrom && parsedDateTo){
    if(parsedDateFrom > parsedDateTo) return INVALID_DATE;
    return { dateFrom: parsedDateFrom, dateTo: parsedDateTo };
  }

  if(parsedDateTo){
    const dateTo = fromDateOnlyValue(parsedDateTo);
    const dateFrom = new Date(dateTo);
    dateFrom.setDate(dateFrom.getDate() - 29);
    return {
      dateFrom: toDateOnlyValue(dateFrom),
      dateTo: parsedDateTo
    };
  }

  if(parsedDateFrom){
    const defaultRange = getDefaultDateRange();
    if(parsedDateFrom > defaultRange.dateTo) return INVALID_DATE;
    return {
      dateFrom: parsedDateFrom,
      dateTo: defaultRange.dateTo
    };
  }

  return getDefaultDateRange();
}

function getSqlErrorNumber(err){
  return Number(
    err?.number ??
    err?.originalError?.info?.number ??
    err?.precedingErrors?.[0]?.number ??
    NaN
  );
}

function resolveRequestedClinicId(req){
  if(req.query?.idClinica !== undefined || req.query?.clinicId !== undefined){
    return parseNonNegativeInt(req.query?.idClinica ?? req.query?.clinicId);
  }

  const headerClinicId = req.headers?.['x-clinic-id'];
  if(headerClinicId !== undefined){
    return parseNonNegativeInt(headerClinicId);
  }

  const userClinicId = req.user?.idClinica ?? req.user?.clinicId;
  if(userClinicId !== undefined && userClinicId !== null){
    return parseNonNegativeInt(userClinicId);
  }

  return null;
}

function resolveReportContext(req, options = {}){
  const allowAdministratorAllClinics = options.allowAdministratorAllClinics === true;
  const requireAdministratorUserId = options.requireAdministratorUserId === true;
  const rol = normalizeRoleForSp(req.user?.rol ?? req.user?.role);
  if(!VALID_ROLES.has(rol)){
    const error = new Error('rol invalido');
    error.status = 400;
    throw error;
  }

  const userId = Number(req.user?.userId ?? req.user?.sub);
  const userIdParam = Number.isInteger(userId) && userId > 0 ? userId : null;
  const requestedClinicId = resolveRequestedClinicId(req);

  if(requestedClinicId === INVALID_NUMBER){
    const error = new Error('idClinica invalido');
    error.status = 400;
    throw error;
  }

  if(rol === 'SuperAdmin'){
    return {
      rol,
      userId: null,
      idClinica: requestedClinicId === null ? 0 : requestedClinicId
    };
  }

  if(rol === 'Administrador'){
    const idClinica =
      requestedClinicId === null
        ? (allowAdministratorAllClinics ? 0 : null)
        : requestedClinicId;

    if(idClinica === null || (!allowAdministratorAllClinics && idClinica === 0)){
      const error = new Error('idClinica requerido');
      error.status = 400;
      throw error;
    }

    if(requireAdministratorUserId && !(Number.isInteger(userIdParam) && userIdParam > 0)){
      const error = new Error('userId invalido');
      error.status = 401;
      throw error;
    }

    return {
      rol,
      userId: requireAdministratorUserId ? userIdParam : null,
      idClinica
    };
  }

  if(requestedClinicId === null || requestedClinicId === 0){
    const error = new Error('idClinica requerido');
    error.status = 400;
    throw error;
  }

  if(rol === 'Empleado' && !(Number.isInteger(userIdParam) && userIdParam > 0)){
    const error = new Error('userId invalido');
    error.status = 401;
    throw error;
  }

  return {
    rol,
    userId: userIdParam,
    idClinica: requestedClinicId
  };
}

function formatReportResponse(result){
  const recordsets = Array.isArray(result?.recordsets) ? result.recordsets : [];
  if(recordsets.length > 1){
    return {
      data: recordsets[0] || [],
      extra: recordsets[1] || []
    };
  }

  return {
    data: result?.recordset || []
  };
}

async function runReport(req, res, { procedureName, extraParams = [], contextOptions = {} }){
  try{
    const context = resolveReportContext(req, contextOptions);
    const result = await executeReportProcedure({
      db: req.db,
      procedureName,
      params: [
        { name: 'Rol', type: req.sql.NVarChar(20), value: context.rol },
        { name: 'UserId', type: req.sql.Int, value: context.userId },
        { name: 'IdClinica', type: req.sql.Int, value: context.idClinica },
        ...extraParams
      ]
    });

    return res.json(formatReportResponse(result));
  }catch(err){
    if(err?.status){
      return res.status(err.status).json({ message: err.message || 'Error' });
    }

    const number = getSqlErrorNumber(err);
    if(number >= 50000 && number < 60000){
      return res.status(400).json({ message: err.message || 'Error' });
    }

    return res.status(500).json({ message: err.message || 'Error' });
  }
}

async function patientsRevenueByDay(req, res){
  const dateRange = resolveDateRange(req.query);
  if(dateRange === INVALID_DATE){
    return res.status(400).json({ message: 'dateFrom/dateTo invalidos' });
  }

  return runReport(req, res, {
    procedureName: 'dbo.spRpt_Patients_RevenueByDay',
    extraParams: [
      { name: 'DateFrom', type: req.sql.Date, value: dateRange.dateFrom },
      { name: 'DateTo', type: req.sql.Date, value: dateRange.dateTo }
    ]
  });
}

async function patientsOrdersList(req, res){
  const dateRange = resolveDateRange(req.query);
  const query = parseOptionalText(req.query?.query, { maxLength: 200 });

  if(dateRange === INVALID_DATE){
    return res.status(400).json({ message: 'dateFrom/dateTo invalidos' });
  }
  if(query === INVALID_TEXT){
    return res.status(400).json({ message: 'query invalido' });
  }

  return runReport(req, res, {
    procedureName: 'dbo.spRpt_Orders_List',
    contextOptions: {
      allowAdministratorAllClinics: true,
      requireAdministratorUserId: true
    },
    extraParams: [
      { name: 'DateFrom', type: req.sql.Date, value: dateRange.dateFrom },
      { name: 'DateTo', type: req.sql.Date, value: dateRange.dateTo },
      { name: 'Query', type: req.sql.NVarChar(200), value: query }
    ]
  });
}

async function patientsPendingDeliveries(req, res){
  const take = parsePositiveInt(req.query?.take);
  if(take === INVALID_NUMBER){
    return res.status(400).json({ message: 'take invalido' });
  }

  return runReport(req, res, {
    procedureName: 'dbo.spRpt_Patients_PendingDeliveries',
    extraParams: [
      { name: 'Take', type: req.sql.Int, value: take ?? 50 }
    ]
  });
}

async function patientsReceivables(req, res){
  const take = parsePositiveInt(req.query?.take);
  if(take === INVALID_NUMBER){
    return res.status(400).json({ message: 'take invalido' });
  }

  return runReport(req, res, {
    procedureName: 'dbo.spRpt_Patients_AccountsReceivable',
    extraParams: [
      { name: 'Take', type: req.sql.Int, value: take ?? 100 }
    ]
  });
}

async function quotationsByDay(req, res){
  const dateRange = resolveDateRange(req.query);
  if(dateRange === INVALID_DATE){
    return res.status(400).json({ message: 'dateFrom/dateTo invalidos' });
  }

  return runReport(req, res, {
    procedureName: 'dbo.spRpt_Quotations_ByDay',
    extraParams: [
      { name: 'DateFrom', type: req.sql.Date, value: dateRange.dateFrom },
      { name: 'DateTo', type: req.sql.Date, value: dateRange.dateTo }
    ]
  });
}

async function inventoryValuation(req, res){
  return runReport(req, res, {
    procedureName: 'dbo.spRpt_Inventory_Valuation'
  });
}

async function inventoryLowStock(req, res){
  const threshold = parseNonNegativeInt(req.query?.threshold);
  const take = parsePositiveInt(req.query?.take);

  if(threshold === INVALID_NUMBER){
    return res.status(400).json({ message: 'threshold invalido' });
  }
  if(take === INVALID_NUMBER){
    return res.status(400).json({ message: 'take invalido' });
  }

  return runReport(req, res, {
    procedureName: 'dbo.spRpt_Inventory_LowStock',
    extraParams: [
      { name: 'Threshold', type: req.sql.Int, value: threshold ?? 3 },
      { name: 'Take', type: req.sql.Int, value: take ?? 200 }
    ]
  });
}

async function expensesByDay(req, res){
  const dateRange = resolveDateRange(req.query);
  if(dateRange === INVALID_DATE){
    return res.status(400).json({ message: 'dateFrom/dateTo invalidos' });
  }

  return runReport(req, res, {
    procedureName: 'dbo.spRpt_Expenses_ByDay',
    extraParams: [
      { name: 'DateFrom', type: req.sql.Date, value: dateRange.dateFrom },
      { name: 'DateTo', type: req.sql.Date, value: dateRange.dateTo }
    ]
  });
}

module.exports = {
  patientsRevenueByDay,
  patientsOrdersList,
  patientsPendingDeliveries,
  patientsReceivables,
  quotationsByDay,
  inventoryValuation,
  inventoryLowStock,
  expensesByDay
};
