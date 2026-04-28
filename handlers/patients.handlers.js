const INVALID_NUMBER = Symbol('invalid_number');
const INVALID_JSON = Symbol('invalid_json');

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

function normalizeRole(value){
  return String(value ?? '').trim().toLowerCase();
}

function normalizeRoleForSp(value){
  const raw = String(value ?? '').trim();
  const lower = raw.toLowerCase();

  if(lower === 'superadmin') return 'SuperAdmin';
  if(lower === 'administrador') return 'Administrador';
  if(lower === 'empleado') return 'Empleado';
  return raw;
}

function canEditExistingPatient(user){
  const role = normalizeRole(user?.rol ?? user?.role);
  return role === 'superadmin' || role === 'administrador';
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

function firstText(...values){
  for(const value of values){
    const text = toText(value);
    if(text !== null) return text;
  }

  return null;
}

function toJsonText(v){
  if(v === null || v === undefined) return null;

  if(typeof v === 'string'){
    const text = v.trim();
    if(!text) return null;

    try{
      return JSON.stringify(JSON.parse(text));
    }catch{
      return INVALID_JSON;
    }
  }

  try{
    const json = JSON.stringify(v);
    return json === undefined ? INVALID_JSON : json;
  }catch{
    return INVALID_JSON;
  }
}

function fromJsonText(v, fallback = []){
  if(v === null || v === undefined) return fallback;
  if(typeof v !== 'string') return v;

  const text = v.trim();
  if(!text) return fallback;

  try{
    return JSON.parse(text);
  }catch{
    return fallback;
  }
}

function mapPatientBody(b){
  return {
    ExamDate: toText(b.fecha),
    Name: toText(b.nombre),
    Address: toText(b.direccion),
    Profession: toText(b.profesion ?? b.profession),
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

    Rx_AV_OD_20: toText(b.av_od_20),
    Rx_AV_OI_20: toText(b.av_oi_20),

    //receta inicial
    Rxi_OD_Sphere: toText(b.rxiOdSphere),
    Rxi_OD_Cyl: toText(b.rxiOdCyl),
    Rxi_OD_Axis: toText(b.rxiOdAxis),
    Rxi_OD_Add: toText(b.rxiOdAdd),
    Rxi_OD_Alt: toText(b.rxiOdAlt),

    Rxi_OI_Sphere: toText(b.rxiOiSphere),
    Rxi_OI_Cyl: toText(b.rxiOiCyl),
    Rxi_OI_Axis: toText(b.rxiOiAxis),
    Rxi_OI_Add: toText(b.rxiOiAdd),
    Rxi_OI_Alt: toText(b.rxiOiAlt),
    Rxi_AV_OD_20: toText(b.rxiAvOd20),
    Rxi_AV_OI_20: toText(b.rxiAvOi20),

    Frame: toText(b.aro),
    Dip: toText(b.dip),
    Material: toText(b.material),
    Lens: toText(b.lente),
    Treatment: toText(b.tratamiento),
    ProductsJson: toJsonText(b.productos ?? b.products ?? b.Products),

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
    if(p.ProductsJson === INVALID_JSON){
      return res.status(400).json({ message: 'products debe ser un json valido' });
    }

    const r = await req.db.request()
      .input('ExamDate', req.sql.Date, p.ExamDate)
      .input('Name', req.sql.NVarChar(150), p.Name)
      .input('Address', req.sql.NVarChar(200), p.Address)
      .input('Profession', req.sql.NVarChar(120), p.Profession)
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

      .input('Rx_AV_OD_20', req.sql.NVarChar(20), p.Rx_AV_OD_20)
      .input('Rx_AV_OI_20', req.sql.NVarChar(20), p.Rx_AV_OI_20)

      .input('Rxi_OD_Sphere', req.sql.NVarChar(20), p.Rxi_OD_Sphere)
      .input('Rxi_OD_Cyl', req.sql.NVarChar(20), p.Rxi_OD_Cyl)
      .input('Rxi_OD_Axis', req.sql.NVarChar(20), p.Rxi_OD_Axis)
      .input('Rxi_OD_Add', req.sql.NVarChar(20), p.Rxi_OD_Add)
      .input('Rxi_OD_Alt', req.sql.NVarChar(20), p.Rxi_OD_Alt)
      .input('Rxi_OI_Sphere', req.sql.NVarChar(20), p.Rxi_OI_Sphere)
      .input('Rxi_OI_Cyl', req.sql.NVarChar(20), p.Rxi_OI_Cyl)
      .input('Rxi_OI_Axis', req.sql.NVarChar(20), p.Rxi_OI_Axis)
      .input('Rxi_OI_Add', req.sql.NVarChar(20), p.Rxi_OI_Add)
      .input('Rxi_OI_Alt', req.sql.NVarChar(20), p.Rxi_OI_Alt)
      .input('Rxi_AV_OD_20', req.sql.NVarChar(20), p.Rxi_AV_OD_20)
      .input('Rxi_AV_OI_20', req.sql.NVarChar(20), p.Rxi_AV_OI_20)

      .input('Frame', req.sql.NVarChar(80), p.Frame)
      .input('Dip', req.sql.NVarChar(30), p.Dip)
      .input('Material', req.sql.NVarChar(80), p.Material)
      .input('Lens', req.sql.NVarChar(120), p.Lens)
      .input('Treatment', req.sql.NVarChar(120), p.Treatment)
      .input('Products', req.sql.NVarChar(req.sql.MAX), p.ProductsJson)

      .input('Total', req.sql.Decimal(10,2), p.Total)
      .input('Deposit', req.sql.Decimal(10,2), p.Deposit)
      .input('Balance', req.sql.Decimal(10,2), p.Balance)
      .input('PaymentMethod', req.sql.NVarChar(30), p.PaymentMethod)
      .input('Comments', req.sql.NVarChar(500), p.Comments)

      .input('CreatedByUserId', req.sql.Int, req.user?.userId || null)
      .execute('spPatients_Create');

      console.log('ERES MUY TIERNO HOMERO:: ', p.ExamDate);

    const row = r.recordset?.[0];
    return res.json({
      patientId: row.PatientId,
      orderNo: row.OrderNo,
      name: row.Name,
      profession: row.Profession ?? p.Profession,
      idClinica: row.IdClinica ?? p.IdClinica ?? null,
      products: fromJsonText(row.Products ?? p.ProductsJson, [])
    });

  }catch(err){
    const number = getSqlErrorNumber(err);
    if([
      50020,
      50021,
      50022,
      50023,
      50024,
      50025,
      50026,
      50027
    ].includes(number)){
      return res.status(400).json({ message: err.message || 'La clinica enviada no existe.' });
    }
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** PUT /api/patients/:id */
async function update(req, res){
  try{
    if(!canEditExistingPatient(req.user)){
      return res.status(403).json({ message: 'Solo SuperAdmin y Administrador pueden editar ordenes.' });
    }

    const id = Number(req.params.id);
    if(!Number.isInteger(id) || id < 1){
      return res.status(400).json({ message: 'id invalido' });
    }

    const idClinica = resolveClinicScopeId(req);
    if(idClinica === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const existing = await req.db.request()
      .input('PatientId', req.sql.Int, id)
      .input('IdClinica', req.sql.Int, idClinica)
      .execute('spPatients_GetById');

    if(!existing.recordset?.[0]){
      return res.status(404).json({ message: 'No encontrado' });
    }

    const p = mapPatientBody(req.body || {});
    if(!p.ExamDate || !p.Name){
      return res.status(400).json({ message: 'fecha y nombre son requeridos' });
    }
    if(p.IdClinica === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }
    if(p.ProductsJson === INVALID_JSON){
      return res.status(400).json({ message: 'products debe ser un json valido' });
    }

    const r = await req.db.request()
      .input('PatientId', req.sql.Int, id)
      .input('ExamDate', req.sql.Date, p.ExamDate)
      .input('Name', req.sql.NVarChar(150), p.Name)
      .input('Address', req.sql.NVarChar(200), p.Address)
      .input('Profession', req.sql.NVarChar(120), p.Profession)
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

      .input('Rx_AV_OD_20', req.sql.NVarChar(20), p.Rx_AV_OD_20)
      .input('Rx_AV_OI_20', req.sql.NVarChar(20), p.Rx_AV_OI_20)

      .input('Rxi_OD_Sphere', req.sql.NVarChar(20), p.Rxi_OD_Sphere)
      .input('Rxi_OD_Cyl', req.sql.NVarChar(20), p.Rxi_OD_Cyl)
      .input('Rxi_OD_Axis', req.sql.NVarChar(20), p.Rxi_OD_Axis)
      .input('Rxi_OD_Add', req.sql.NVarChar(20), p.Rxi_OD_Add)
      .input('Rxi_OD_Alt', req.sql.NVarChar(20), p.Rxi_OD_Alt)
      .input('Rxi_OI_Sphere', req.sql.NVarChar(20), p.Rxi_OI_Sphere)
      .input('Rxi_OI_Cyl', req.sql.NVarChar(20), p.Rxi_OI_Cyl)
      .input('Rxi_OI_Axis', req.sql.NVarChar(20), p.Rxi_OI_Axis)
      .input('Rxi_OI_Add', req.sql.NVarChar(20), p.Rxi_OI_Add)
      .input('Rxi_OI_Alt', req.sql.NVarChar(20), p.Rxi_OI_Alt)
      .input('Rxi_AV_OD_20', req.sql.NVarChar(20), p.Rxi_AV_OD_20)
      .input('Rxi_AV_OI_20', req.sql.NVarChar(20), p.Rxi_AV_OI_20)

      .input('Frame', req.sql.NVarChar(80), p.Frame)
      .input('Dip', req.sql.NVarChar(30), p.Dip)
      .input('Material', req.sql.NVarChar(80), p.Material)
      .input('Lens', req.sql.NVarChar(120), p.Lens)
      .input('Treatment', req.sql.NVarChar(120), p.Treatment)
      .input('Products', req.sql.NVarChar(req.sql.MAX), p.ProductsJson)

      .input('Total', req.sql.Decimal(10,2), p.Total)
      .input('Deposit', req.sql.Decimal(10,2), p.Deposit)
      .input('Balance', req.sql.Decimal(10,2), p.Balance)
      .input('PaymentMethod', req.sql.NVarChar(30), p.PaymentMethod)
      .input('Comments', req.sql.NVarChar(500), p.Comments)

      .input('UpdatedByUserId', req.sql.Int, req.user?.userId || null)
      .execute('spPatients_Update');

    const row = r.recordset?.[0];
    return res.json({
      patientId: row.PatientId,
      orderNo: row.OrderNo,
      name: row.Name,
      profession: row.Profession ?? p.Profession,
      idClinica: row.IdClinica ?? p.IdClinica ?? null,
      products: fromJsonText(row.Products ?? p.ProductsJson, [])
    });

  }catch(err){
    const number = getSqlErrorNumber(err);
    if([50020,50021,50022,50023,50024,50025,50026,50027,50028].includes(number)){
      return res.status(400).json({ message: err.message || 'No se pudo actualizar la orden.' });
    }
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** GET /api/patients/search?q=... */
async function search(req, res) {
  try {

    console.log('ENTRA A CONSULTAR ORDENES POR ID CLINICA Y POR ID USUARIO');
    console.log('app.get("/api/patients/search", authMiddleware, patients.search);');


    const q = String(req.query.q || '').trim();
    const requestedClinicId = req.query?.idClinica ?? req.query?.clinicId ?? req.headers?.['x-clinic-id'];
    const idClinica = requestedClinicId === undefined ? 0 : toClinicScopeId(requestedClinicId);
    const rol = normalizeRoleForSp(req.user?.rol ?? req.user?.role);
    const userId = Number(req.user?.userId ?? req.user?.sub);
    if(idClinica === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const r = await req.db.request()
      .input('Query', req.sql.NVarChar(200), q)
      .input('Rol', req.sql.NVarChar(20), rol)
      .input('UserId', req.sql.Int, Number.isInteger(userId) && userId > 0 ? userId : null)
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
      idClinica: x.IdClinica ?? null,
      nombreClinica: x.NombreClinica ?? null
    })));
  }catch(err){
    const number = getSqlErrorNumber(err);
    if([50071,50072,50073,50074].includes(number)){
      return res.status(400).json({ message: err.message || 'Parametros invalidos para buscar pacientes' });
    }
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** GET /api/patients/:id */
async function getById(req, res){
  try{

    console.log('app.get("/api/patients/:id", authMiddleware, patients.getById ');

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

    //console.log('LOL TE JODES:: ', x);

    return res.json({
      patientId: x.PatientId,
      orderNo: x.OrderNo,
      examDate: x.ExamDate,
      name: x.Name,
      idClinica: x.IdClinica ?? null,
      nombreUsuario: x.FullName,
      address: x.Address,
      profession: x.Profession,
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

      rx_AV_OD_20: x.Rx_AV_OD_20,
      rx_AV_OI_20: x.Rx_AV_OI_20,

      rxiOdSphere: x.Rxi_OD_Sphere,
      rxiOdCyl: x.Rxi_OD_Cyl,
      rxiOdAxis: x.Rxi_OD_Axis,
      rxiOdAdd: x.Rxi_OD_Add,
      rxiOdAlt: x.Rxi_OD_Alt,
      rxiOiSphere: x.Rxi_OI_Sphere,
      rxiOiCyl: x.Rxi_OI_Cyl,
      rxiOiAxis: x.Rxi_OI_Axis,
      rxiOiAdd: x.Rxi_OI_Add,
      rxiOiAlt: x.Rxi_OI_Alt,
      rxiAvOd20: x.Rxi_AV_OD_20,
      rxiAvOi20: x.Rxi_AV_OI_20,

      frame: x.Frame,
      dip: x.Dip,
      material: x.Material,
      lens: x.Lens,
      treatment: x.Treatment,
      products: fromJsonText(x.Products, []),

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

/** GET /api/patients/order/:orderNo */ //se agrega validación por usuario
async function getByOrder(req, res){
  console.log('choricito req en getByOrder: ', req.params);
  try{
    const orderNo = Number(req.params.orderNo);
    if(!Number.isInteger(orderNo) || orderNo < 1){
      return res.status(400).json({ message: 'orderNo invalido' });
    }
    
    const idClinica = resolveClinicScopeId(req);

    console.log('idClinica:: ', idClinica);

    if(idClinica === INVALID_NUMBER){
      return res.status(400).json({ message: 'idClinica invalido' });
    }
    if(idClinica < 1){
      return res.status(400).json({ message: 'idClinica requerido para buscar por numero de orden' });
    }

    const r = await req.db.request()
      .input('OrderNo', req.sql.Int, orderNo)
      .input('IdClinica', req.sql.Int, idClinica)
      .execute('spPatients_GetByOrderNo');

    const x = r.recordset?.[0];
    if(!x) return res.status(404).json({ message: 'No encontrado' });

    console.log('ORDEN:: ', x);

    return res.json({
      patientId: x.PatientId,
      orderNo: x.OrderNo,
      examDate: x.ExamDate,
      name: x.Name,
      idClinica: x.IdClinica ?? null,
      nombreClinica: x.NombreClinica ?? x.ClinicName ?? null,
      nombreUsuario: x.NombreUsuario,
      address: x.Address,
      profession: x.Profession,
      phone: x.Phone,
      optometrist: x.Optometrist,
      rxiOdSphere: x.Rxi_OD_Sphere,
      rxiOdCyl: x.Rxi_OD_Cyl,
      rxiOdAxis: x.Rxi_OD_Axis,
      rxiOdAdd: x.Rxi_OD_Add,
      rxiOdAlt: x.Rxi_OD_Alt,
      rxiOiSphere: x.Rxi_OI_Sphere,
      rxiOiCyl: x.Rxi_OI_Cyl,
      rxiOiAxis: x.Rxi_OI_Axis,
      rxiOiAdd: x.Rxi_OI_Add,
      rxiOiAlt: x.Rxi_OI_Alt,
      rxiAvOd20: x.Rxi_AV_OD_20,
      rxiAvOi20: x.Rxi_AV_OI_20,
      frame: x.Frame,
      dip: x.Dip,
      material: x.Material,
      lens: x.Lens,
      treatment: x.Treatment,
      products: fromJsonText(x.Products, []),
      total: Number(x.Total ?? 0),
      deposit: Number(x.Deposit ?? 0),
      balance: Number(x.Balance ?? 0),
      paymentMethod: x.PaymentMethod,
      comments: x.Comments,
      labCode: x.LabCode,
      deliveredBy: x.DeliveredBy,
      deliveryDate: x.DeliveryDate,


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
    const number = getSqlErrorNumber(err);
    if(number === 50029){
      return res.status(400).json({ message: err.message || 'idClinica requerido para buscar por numero de orden' });
    }
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

// Shared implementation for both lab-code routes.
async function setLabCode(req, res){
  const id = Number(req.params.id);
  const labCode = toText(req.body?.labCode);

  if(!Number.isInteger(id) || id < 1){
    return res.status(400).json({ message: 'PatientId invalido' });
  }
  if(!labCode){
    return res.status(400).json({ message: 'labCode requerido' });
  }

  const r = await req.db.request()
    .input('PatientId', req.sql.Int, id)
    .input('LabCode', req.sql.NVarChar(50), labCode)
    .execute('spPatients_UpdateLabCode');

  const out = r.recordset?.[0];
  if(out?.ErrorMessage) return res.status(409).json({ message: out.ErrorMessage });

  return res.json({ ok:true, labCode });
}

/** PUT /api/patients/:id/lab-code */
async function updateLabCode(req, res){
  try{
    return await setLabCode(req, res);
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

/** PUT /api/patients/:id/assign-lab-code */
async function assignLabCode(req, res){
  try{
    return await setLabCode(req, res);
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
  update,
  search,
  getById,
  getByOrder,
  updateLabCode,
  assignLabCode,
  confirmDelivery
};
