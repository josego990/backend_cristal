const INVALID_NUMBER = Symbol('invalid_number');

function toBit(v){
  if(v === true || v === 1) return 1;
  const s = String(v ?? '').trim().toLowerCase();
  if(['si','sí','1','true','x'].includes(s)) return 1;
  if(['no','0','false'].includes(s)) return 0;
  return null;
}

function toNum(v){
  if(v === null || v === undefined || String(v).trim()==='') return null;
  const n = Number(String(v).replace(',','.'));
  return Number.isFinite(n) ? n : null;
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

function toText(v){
  const s = (v === null || v === undefined) ? '' : String(v);
  const t = s.trim();
  return t.length ? t : null;
}

function mapPatientBody(b){
  return {
    ExamDate: toText(b.fecha),
    Name: toText(b.nombre),
    Address: toText(b.direccion),
    Phone: toText(b.telefono),
    Optometrist: toText(b.opt || b['Opt.']),
    IdClinica: toClinicId(b.idClinica ?? b.clinicId ?? b.id_clinica),

    IsFirstExam: toBit(b.primer_examen),
    UsesRx: toBit(b.usa_rx),
    HasDiabetes: toBit(b.diabetes),
    HasBlindness: toBit(b.ceguera),
    HasHypertension: toBit(b.hipertension),

    HasCefalea: toBit(b.cefalea),
    HasArdorOcular: toBit(b.ardor_ocular),
    HasDolorOcular: toBit(b.dolor_ocular),
    HasPrurito: toBit(b.prurito),
    HasFotofobia: toBit(b.fotofobia),
    HasBlindness2: toBit(b.ceguera2),
    HasVisionBorrosa: toBit(b.vision_borrosa),
    HasSecreciones: toBit(b.secreciones),

    OD_Sphere_Lensometry: toText(b.od_esfera),
    OD_Cyl_Lensometry: toText(b.od_cilindro),
    OD_Axis_Lensometry: toText(b.od_eje),
    OD_Add_Lensometry: toText(b.od_adicion),
    OI_Sphere_Lensometry: toText(b.oi_esfera),
    OI_Cyl_Lensometry: toText(b.oi_cilindro),
    OI_Axis_Lensometry: toText(b.oi_eje),
    OI_Add_Lensometry: toText(b.oi_adicion),

    AV_OD_20: toText(b.av_od_20),
    PH_OD_20: toText(b.ph_od_20),
    CC_OD_20: toText(b.cc_od_20),
    AV_OI_20: toText(b.av_oi_20),
    PH_OI_20: toText(b.ph_oi_20),
    CC_OI_20: toText(b.cc_oi_20),

    Auto_OD_Sphere: toText(b.ev_ob_od_esfera),
    Auto_OD_Cyl: toText(b.ev_ob_od_cilindro),
    Auto_OD_Axis: toText(b.ev_ob_od_eje),
    Auto_OI_Sphere: toText(b.ev_ob_oi_esfera),
    Auto_OI_Cyl: toText(b.ev_ob_oi_cilindro),
    Auto_OI_Axis: toText(b.ev_ob_oi_eje),

    Rx_OD_Sphere: toText(b.opto_od_esfera),
    Rx_OD_Cyl: toText(b.opto_od_cilindro),
    Rx_OD_Axis: toText(b.opto_od_eje),
    Rx_OD_Add: toText(b.opto_od_adicion),
    Rx_OD_Alt: toText(b.opto_od_altura),

    Rx_OI_Sphere: toText(b.opto_oi_esfera),
    Rx_OI_Cyl: toText(b.opto_oi_cilindro),
    Rx_OI_Axis: toText(b.opto_oi_eje),
    Rx_OI_Add: toText(b.opto_oi_adicion),
    Rx_OI_Alt: toText(b.opto_oi_altura),

    Frame: toText(b.aro),
    Dip: toText(b.dip),
    Material: toText(b.material),
    Lens: toText(b.lente),
    Treatment: toText(b.tratamiento),

    Total: toNum(b.costo_total),
    Deposit: toNum(b.anticipo),
    Balance: toNum(b.saldo),
    PaymentMethod: toText(b.metodo_pago),
    Comments: toText(b.comentarios)
  };
}

/** POST /api/patients */
async function create(req, res){
  try{
    const p = mapPatientBody(req.body || {});
    if(!p.ExamDate || !p.Name){
      return res.status(400).json({ message: 'fecha y nombre son requeridos' });
    }
    if(p.IdClinica === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const r = await req.db.request()
      .input('ExamDate', req.sql.Date, p.ExamDate)
      .input('Name', req.sql.NVarChar(150), p.Name)
      .input('Address', req.sql.NVarChar(200), p.Address)
      .input('Phone', req.sql.NVarChar(30), p.Phone)
      .input('Optometrist', req.sql.NVarChar(50), p.Optometrist)
      .input('IdClinica', req.sql.Int, p.IdClinica)

      .input('IsFirstExam', req.sql.Bit, p.IsFirstExam)
      .input('UsesRx', req.sql.Bit, p.UsesRx)
      .input('HasDiabetes', req.sql.Bit, p.HasDiabetes)
      .input('HasBlindness', req.sql.Bit, p.HasBlindness)
      .input('HasHypertension', req.sql.Bit, p.HasHypertension)

      .input('HasCefalea', req.sql.Bit, p.HasCefalea)
      .input('HasArdorOcular', req.sql.Bit, p.HasArdorOcular)
      .input('HasDolorOcular', req.sql.Bit, p.HasDolorOcular)
      .input('HasPrurito', req.sql.Bit, p.HasPrurito)
      .input('HasFotofobia', req.sql.Bit, p.HasFotofobia)
      .input('HasBlindness2', req.sql.Bit, p.HasBlindness2)
      .input('HasVisionBorrosa', req.sql.Bit, p.HasVisionBorrosa)
      .input('HasSecreciones', req.sql.Bit, p.HasSecreciones)

      .input('OD_Sphere_Lensometry', req.sql.NVarChar(20), p.OD_Sphere_Lensometry)
      .input('OD_Cyl_Lensometry', req.sql.NVarChar(20), p.OD_Cyl_Lensometry)
      .input('OD_Axis_Lensometry', req.sql.NVarChar(20), p.OD_Axis_Lensometry)
      .input('OD_Add_Lensometry', req.sql.NVarChar(20), p.OD_Add_Lensometry)
      .input('OI_Sphere_Lensometry', req.sql.NVarChar(20), p.OI_Sphere_Lensometry)
      .input('OI_Cyl_Lensometry', req.sql.NVarChar(20), p.OI_Cyl_Lensometry)
      .input('OI_Axis_Lensometry', req.sql.NVarChar(20), p.OI_Axis_Lensometry)
      .input('OI_Add_Lensometry', req.sql.NVarChar(20), p.OI_Add_Lensometry)

      .input('AV_OD_20', req.sql.NVarChar(20), p.AV_OD_20)
      .input('PH_OD_20', req.sql.NVarChar(20), p.PH_OD_20)
      .input('CC_OD_20', req.sql.NVarChar(20), p.CC_OD_20)
      .input('AV_OI_20', req.sql.NVarChar(20), p.AV_OI_20)
      .input('PH_OI_20', req.sql.NVarChar(20), p.PH_OI_20)
      .input('CC_OI_20', req.sql.NVarChar(20), p.CC_OI_20)

      .input('Auto_OD_Sphere', req.sql.NVarChar(20), p.Auto_OD_Sphere)
      .input('Auto_OD_Cyl', req.sql.NVarChar(20), p.Auto_OD_Cyl)
      .input('Auto_OD_Axis', req.sql.NVarChar(20), p.Auto_OD_Axis)
      .input('Auto_OI_Sphere', req.sql.NVarChar(20), p.Auto_OI_Sphere)
      .input('Auto_OI_Cyl', req.sql.NVarChar(20), p.Auto_OI_Cyl)
      .input('Auto_OI_Axis', req.sql.NVarChar(20), p.Auto_OI_Axis)

      .input('Rx_OD_Sphere', req.sql.NVarChar(20), p.Rx_OD_Sphere)
      .input('Rx_OD_Cyl', req.sql.NVarChar(20), p.Rx_OD_Cyl)
      .input('Rx_OD_Axis', req.sql.NVarChar(20), p.Rx_OD_Axis)
      .input('Rx_OD_Add', req.sql.NVarChar(20), p.Rx_OD_Add)
      .input('Rx_OD_Alt', req.sql.NVarChar(20), p.Rx_OD_Alt)
      .input('Rx_OI_Sphere', req.sql.NVarChar(20), p.Rx_OI_Sphere)
      .input('Rx_OI_Cyl', req.sql.NVarChar(20), p.Rx_OI_Cyl)
      .input('Rx_OI_Axis', req.sql.NVarChar(20), p.Rx_OI_Axis)
      .input('Rx_OI_Add', req.sql.NVarChar(20), p.Rx_OI_Add)
      .input('Rx_OI_Alt', req.sql.NVarChar(20), p.Rx_OI_Alt)

      .input('Frame', req.sql.NVarChar(80), p.Frame)
      .input('Dip', req.sql.NVarChar(30), p.Dip)
      .input('Material', req.sql.NVarChar(80), p.Material)
      .input('Lens', req.sql.NVarChar(120), p.Lens)
      .input('Treatment', req.sql.NVarChar(120), p.Treatment)

      .input('Total', req.sql.Decimal(10,2), p.Total)
      .input('Deposit', req.sql.Decimal(10,2), p.Deposit)
      .input('Balance', req.sql.Decimal(10,2), p.Balance)
      .input('PaymentMethod', req.sql.NVarChar(30), p.PaymentMethod)
      .input('Comments', req.sql.NVarChar(500), p.Comments)

      .input('CreatedByUserId', req.sql.Int, req.user?.userId || null)
      .execute('spPatients_Create');

    const row = r.recordset?.[0];
    return res.json({
      patientId: row.PatientId,
      orderNo: row.OrderNo,
      name: row.Name,
      idClinica: row.IdClinica ?? p.IdClinica ?? null
    });

  }catch(err){
    const number = getSqlErrorNumber(err);
    if(number === 50020){
      return res.status(400).json({ message: err.message || 'La clinica enviada no existe.' });
    }
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** GET /api/patients/search?q=... */
async function search(req, res) {
  try {

    console.log('app.get("/api/patients/search", authMiddleware, patients.search);');


    const q = String(req.query.q || '').trim();
    const idClinica = resolveClinicScopeId(req);
    if(idClinica === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const r = await req.db.request()
      .input('Query', req.sql.NVarChar(200), q)
      .input('IdClinica', req.sql.Int, idClinica)
      .execute('spPatients_Search');

    return res.json((r.recordset || []).map(x=>({
      patientId: x.PatientId,
      orderNo: x.OrderNo,
      examDate: x.ExamDate,
      name: x.Name,
      phone: x.Phone,
      balance: Number(x.Balance ?? 0),
      deliveredBy: x.DeliveredBy,
      idClinica: x.IdClinica ?? null
    })));
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** GET /api/patients/:id */
async function getById(req, res){
  try{

    console.log('app.get("/api/patients/:id", authMiddleware, patients.getById);');

    const id = Number(req.params.id);
    const idClinica = resolveClinicScopeId(req);
    if(idClinica === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const r = await req.db.request()
      .input('PatientId', req.sql.Int, id)
      .input('IdClinica', req.sql.Int, idClinica)
      .execute('spPatients_GetById');

    const x = r.recordset?.[0];
    if(!x) return res.status(404).json({ message: 'No encontrado' });

    return res.json({
      patientId: x.PatientId,
      orderNo: x.OrderNo,
      examDate: x.ExamDate,
      name: x.Name,
      idClinica: x.IdClinica ?? null,
      address: x.Address,
      phone: x.Phone,
      optometrist: x.Optometrist,

      isFirstExam: x.IsFirstExam,
      usesRx: x.UsesRx,
      hasDiabetes: x.HasDiabetes,
      hasBlindness: x.HasBlindness,
      hasHypertension: x.HasHypertension,
      hasCefalea: x.HasCefalea,
      hasArdorOcular: x.HasArdorOcular,
      hasDolorOcular: x.HasDolorOcular,
      hasPrurito: x.HasPrurito,
      hasFotofobia: x.HasFotofobia,
      hasBlindness2: x.HasBlindness2,
      hasVisionBorrosa: x.HasVisionBorrosa,
      hasSecreciones: x.HasSecreciones,

      odSphereLensometry: x.OD_Sphere_Lensometry,
      odCylLensometry: x.OD_Cyl_Lensometry,
      odAxisLensometry: x.OD_Axis_Lensometry,
      odAddLensometry: x.OD_Add_Lensometry,
      oiSphereLensometry: x.OI_Sphere_Lensometry,
      oiCylLensometry: x.OI_Cyl_Lensometry,
      oiAxisLensometry: x.OI_Axis_Lensometry,
      oiAddLensometry: x.OI_Add_Lensometry,

      avOd20: x.AV_OD_20,
      phOd20: x.PH_OD_20,
      ccOd20: x.CC_OD_20,
      avOi20: x.AV_OI_20,
      phOi20: x.PH_OI_20,
      ccOi20: x.CC_OI_20,

      autoOdSphere: x.Auto_OD_Sphere,
      autoOdCyl: x.Auto_OD_Cyl,
      autoOdAxis: x.Auto_OD_Axis,
      autoOiSphere: x.Auto_OI_Sphere,
      autoOiCyl: x.Auto_OI_Cyl,
      autoOiAxis: x.Auto_OI_Axis,

      rxOdSphere: x.Rx_OD_Sphere,
      rxOdCyl: x.Rx_OD_Cyl,
      rxOdAxis: x.Rx_OD_Axis,
      rxOdAdd: x.Rx_OD_Add,
      rxOdAlt: x.Rx_OD_Alt,
      rxOiSphere: x.Rx_OI_Sphere,
      rxOiCyl: x.Rx_OI_Cyl,
      rxOiAxis: x.Rx_OI_Axis,
      rxOiAdd: x.Rx_OI_Add,
      rxOiAlt: x.Rx_OI_Alt,

      frame: x.Frame,
      dip: x.Dip,
      material: x.Material,
      lens: x.Lens,
      treatment: x.Treatment,

      total: Number(x.Total ?? 0),
      deposit: Number(x.Deposit ?? 0),
      balance: Number(x.Balance ?? 0),
      paymentMethod: x.PaymentMethod,
      comments: x.Comments,
      labCode: x.LabCode,
      deliveredBy: x.DeliveredBy,
      deliveryDate: x.DeliveryDate,
      createdAt: x.CreatedAt,
      createdByUserId: x.CreatedByUserId ?? null,
      updatedAt: x.UpdatedAt,
      updatedByUserId: x.UpdatedByUserId ?? null
    });
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** GET /api/patients/order/:orderNo */
async function getByOrder(req, res){
  console.log('req en getByOrder: ', req);
  try{
    const orderNo = Number(req.params.orderNo);
    const idClinica = resolveClinicScopeId(req);
    if(idClinica === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const r = await req.db.request()
      .input('OrderNo', req.sql.Int, orderNo)
      .input('IdClinica', req.sql.Int, idClinica)
      .execute('spPatients_GetByOrderNo');

    const x = r.recordset?.[0];
    if(!x) return res.status(404).json({ message: 'No encontrado' });

    return res.json({
      patientId: x.PatientId,
      orderNo: x.OrderNo,
      examDate: x.ExamDate,
      name: x.Name,
      idClinica: x.IdClinica ?? null,
      phone: x.Phone,
      optometrist: x.Optometrist,
      frame: x.Frame,
      dip: x.Dip,
      material: x.Material,
      lens: x.Lens,
      treatment: x.Treatment,
      total: Number(x.Total ?? 0),
      deposit: Number(x.Deposit ?? 0),
      balance: Number(x.Balance ?? 0),
      paymentMethod: x.PaymentMethod,
      comments: x.Comments,
      labCode: x.LabCode,
      deliveredBy: x.DeliveredBy,
      deliveryDate: x.DeliveryDate,

      // para detalle (si lo necesitas en UI)
      isFirstExam: x.IsFirstExam,
      usesRx: x.UsesRx,
      hasDiabetes: x.HasDiabetes,
      hasBlindness: x.HasBlindness,
      hasHypertension: x.HasHypertension,
      hasCefalea: x.HasCefalea,
      hasArdorOcular: x.HasArdorOcular,
      hasDolorOcular: x.HasDolorOcular,
      hasPrurito: x.HasPrurito,
      hasFotofobia: x.HasFotofobia,
      hasBlindness2: x.HasBlindness2,
      hasVisionBorrosa: x.HasVisionBorrosa,
      hasSecreciones: x.HasSecreciones
    });
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** PUT /api/patients/:id/lab-code */
async function updateLabCode(req, res){
  try{
    const id = Number(req.params.id);
    const labCode = String(req.body?.labCode || '').trim();
    if(!labCode) return res.status(400).json({ message: 'labCode requerido' });

    const r = await req.db.request()
      .input('PatientId', req.sql.Int, id)
      .input('LabCode', req.sql.NVarChar(50), labCode)
      .execute('spPatients_UpdateLabCode');

    const out = r.recordset?.[0];
    if(out?.ErrorMessage) return res.status(409).json({ message: out.ErrorMessage });

    return res.json({ ok:true });
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** PUT /api/patients/:id/assign-lab-code */
async function assignLabCode(req, res){
  try{
    const id = Number(req.params.id);
    const r = await req.db.request()
      .input('PatientId', req.sql.Int, id)
      .execute('spPatients_AssignLabCode');

    const out = r.recordset?.[0];
    if(out?.ErrorMessage) return res.status(409).json({ message: out.ErrorMessage });

    return res.json({ labCode: out.AssignedLabCode });
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** PUT /api/patients/:id/deliver */
async function confirmDelivery(req, res){
  try{
    const id = Number(req.params.id);
    const deliveredBy = String(req.body?.deliveredBy || '').trim();
    if(!deliveredBy) return res.status(400).json({ message: 'deliveredBy requerido' });

    const r = await req.db.request()
      .input('PatientId', req.sql.Int, id)
      .input('DeliveredBy', req.sql.NVarChar(80), deliveredBy)
      .input('UpdatedByUserId', req.sql.Int, req.user?.userId || null)
      .execute('spPatients_ConfirmDelivery');

    const out = r.recordset?.[0];
    if(out?.ErrorMessage) return res.status(409).json({ message: out.ErrorMessage });

    return res.json({ ok:true });
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

module.exports = {
  create,
  search,
  getById,
  getByOrder,
  updateLabCode,
  assignLabCode,
  confirmDelivery
};
