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

/** POST /api/quotations */
async function create(req, res){
  try{
    const b = req.body || {};
    const r = await req.db.request()
      .input('Name', req.sql.NVarChar(150), toText(b.nombre))
      .input('Phone', req.sql.NVarChar(30), toText(b.telefono))
      .input('Optometrist', req.sql.NVarChar(50), toText(b.opt))
      .input('Frame', req.sql.NVarChar(120), toText(b.aro))
      .input('Lens', req.sql.NVarChar(150), toText(b.lente))
      .input('Treatment', req.sql.NVarChar(150), toText(b.tratamiento))
      .input('Total', req.sql.Decimal(10,2), toNum(b.total))
      .input('CreatedByUserId', req.sql.Int, req.user?.userId || null)
      .execute('spQuotations_Create');

    const x = r.recordset?.[0];
    return res.json({ quotationId: x.QuotationId });
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** GET /api/quotations?take=30 */
async function list(req, res){
  try{
    const take = Math.min(200, Math.max(1, Number(req.query.take || 30)));
    const r = await req.db.request()
      .input('Take', req.sql.Int, take)
      .execute('spQuotations_List');

    return res.json((r.recordset||[]).map(x=>({
      quotationId: x.QuotationId,
      quoteDate: x.QuoteDate,
      name: x.Name,
      phone: x.Phone,
      optometrist: x.Optometrist,
      frame: x.Frame,
      lens: x.Lens,
      treatment: x.Treatment,
      total: Number(x.Total ?? 0)
    })));
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** GET /api/quotations/:id */
async function getById(req, res){
  try{
    const id = Number(req.params.id);
    const r = await req.db.request()
      .input('QuotationId', req.sql.Int, id)
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
      total: Number(x.Total ?? 0)
    });
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

module.exports = { create, list, getById };
