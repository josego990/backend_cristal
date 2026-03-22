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

/** POST /api/expenses */
async function create(req, res){
  
  const headerClinicId = req.headers?.['x-clinic-id'];
  console.log('headerClinicId:: ', headerClinicId);

  try{
    const b = req.body || {};
    const r = await req.db.request()
      .input('ExpenseDate', req.sql.Date, toText(b.fecha))
      .input('Description', req.sql.NVarChar(220), toText(b.descripcion))
      .input('Amount', req.sql.Decimal(10,2), toNum(b.cantidad))
      .input('UserName', req.sql.NVarChar(80), toText(b.usuario))
      .input('CreatedByUserId', req.sql.Int, req.user?.userId || null)
      .input('IdClinica', headerClinicId || null)
      .execute('spExpenses_Create');

    const x = r.recordset?.[0];
    return res.json({ expenseId: x.ExpenseId });
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** GET /api/expenses?take=50 */
async function list(req, res){
  try{
    const take = Math.min(200, Math.max(1, Number(req.query.take || 50)));

    const IdUser = req.query.userId;

    console.log('IdUser:: ', IdUser);

    const r = await req.db.request()
      .input('Take', req.sql.Int, take)
      .input('IdUser', req.sql.Int, IdUser)
      .execute('spExpenses_List');

    return res.json((r.recordset||[]).map(x=>({
      expenseId: x.ExpenseId,
      expenseDate: x.ExpenseDate,
      description: x.Description,
      amount: Number(x.Amount ?? 0),
      userName: x.UserName,
      codigoClinica: x.Codigo,
      nombreClinica : x.Nombre
    })));
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

module.exports = { create, list };
