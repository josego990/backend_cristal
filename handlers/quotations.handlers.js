const INVALID_NUMBER = Symbol('invalid_number');

function toNum(v){
  if(v === null || v === undefined || String(v).trim()==='') return null;
  const n = Number(String(v).replace(',','.'));
  return Number.isFinite(n) ? n : null;
}

function toText(v){
  const s = (v === null || v === undefined) ? '' : String(v);
  const t = s.trim();
  return t.length ? t : null;
}

function toClinicId(v){
  if(v === null || v === undefined || String(v).trim()==='') return null;
  const n = Number(v);
  if(!Number.isInteger(n) || n < 1) return INVALID_NUMBER;
  return n;
}

function toClinicScopeId(v){
  if(v === null || v === undefined || String(v).trim()==='') return 0;
  const n = Number(v);
  if(!Number.isInteger(n) || n < 0) return INVALID_NUMBER;
  return n;
}

function resolveClinicScopeId(req){
  const queryClinicId = req.query?.idClinica ?? req.query?.clinicId;
  if(queryClinicId !== undefined){
    return toClinicScopeId(queryClinicId);
  }

  const headerClinicId = req.headers?.['x-clinic-id'];
  if(headerClinicId !== undefined){
    return toClinicScopeId(headerClinicId);
  }

  const userClinicId = req.user?.idClinica ?? req.user?.clinicId;
  if(userClinicId !== undefined && userClinicId !== null){
    return toClinicScopeId(userClinicId);
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

/** POST /api/quotations */
async function create(req, res){
  try{
    const b = req.body || {};
    const bodyClinicId = toClinicId(b.idClinica ?? b.clinicId ?? b.id_clinica);
    if(bodyClinicId === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    let idClinica = bodyClinicId;
    if(idClinica === null){
      const clinicScopeId = resolveClinicScopeId(req);
      if(clinicScopeId === INVALID_NUMBER){
        return res.status(400).json({ message: 'idClinica invalido' });
      }
      idClinica = clinicScopeId === 0 ? null : clinicScopeId;
    }

    const r = await req.db.request()
      .input('Name', req.sql.NVarChar(150), toText(b.nombre))
      .input('Phone', req.sql.NVarChar(30), toText(b.telefono))
      .input('Optometrist', req.sql.NVarChar(50), toText(b.opt))
      .input('Frame', req.sql.NVarChar(120), toText(b.aro))
      .input('Lens', req.sql.NVarChar(150), toText(b.lente))
      .input('Treatment', req.sql.NVarChar(150), toText(b.tratamiento))
      .input('Total', req.sql.Decimal(10,2), toNum(b.total))
      .input('IdClinica', req.sql.Int, idClinica)
      .input('CreatedByUserId', req.sql.Int, req.user?.userId || null)
      .execute('spQuotations_Create');

    const x = r.recordset?.[0] || {};
    return res.json({
      quotationId: x.QuotationId,
      idClinica: x.IdClinica ?? idClinica ?? null
    });
  }catch(err){
    const number = getSqlErrorNumber(err);
    if(number === 50030){
      return res.status(400).json({ message: err.message || 'La clinica enviada no existe.' });
    }
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** GET /api/quotations?q=... */
async function list(req, res){
  try{
    const q = String(req.query.q || '').trim();
    const idClinica = resolveClinicScopeId(req);
    if(idClinica === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const r = await req.db.request()
      .input('Query', req.sql.NVarChar(200), q)
      .input('IdClinica', req.sql.Int, idClinica)
      .execute('spQuotations_Search');

    return res.json((r.recordset||[]).map(x=>({
      quotationId: x.QuotationId,
      quoteDate: x.QuoteDate,
      name: x.Name,
      phone: x.Phone,
      optometrist: x.Optometrist,
      frame: x.Frame,
      lens: x.Lens,
      treatment: x.Treatment,
      total: Number(x.Total ?? 0),
      idClinica: x.IdClinica ?? null
    })));
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** GET /api/quotations/:id */
async function getById(req, res){
  try{
    const id = Number(req.params.id);
    if(!Number.isInteger(id) || id < 1){
      return res.status(400).json({ message: 'id invalido' });
    }

    const idClinica = resolveClinicScopeId(req);
    if(idClinica === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const r = await req.db.request()
      .input('QuotationId', req.sql.Int, id)
      .input('IdClinica', req.sql.Int, idClinica)
      .execute('spQuotations_GetById');

    const x = r.recordset?.[0];
    if(!x) return res.status(404).json({ message: 'No encontrado' });

    return res.json({
      quotationId: x.QuotationId,
      quoteDate: x.QuoteDate,
      name: x.Name,
      phone: x.Phone,
      optometrist: x.Optometrist,
      frame: x.Frame,
      lens: x.Lens,
      treatment: x.Treatment,
      total: Number(x.Total ?? 0),
      idClinica: x.IdClinica ?? null
    });
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** DELETE /api/quotations/:id */
async function remove(req, res){
  try{
    const id = Number(req.params.id);
    if(!Number.isInteger(id) || id < 1){
      return res.status(400).json({ message: 'id invalido' });
    }

    const idClinica = resolveClinicScopeId(req);
    if(idClinica === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const existing = await req.db.request()
      .input('QuotationId', req.sql.Int, id)
      .input('IdClinica', req.sql.Int, idClinica)
      .execute('spQuotations_GetById');

    if(!existing.recordset?.[0]){
      return res.status(404).json({ message: 'No encontrado' });
    }

    await req.db.request()
      .input('idQuotation', req.sql.Int, id)
      .execute('spQuitation_Delete');

    return res.json({
      ok: true,
      quotationId: id
    });
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

module.exports = { create, list, getById, remove };
