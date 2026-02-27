const INVALID_NUMBER = Symbol('invalid_number');

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function toText(v) {
  const s = v === null || v === undefined ? '' : String(v);
  const t = s.trim();
  return t.length ? t : null;
}

function parseMoney(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return INVALID_NUMBER;
  return n;
}

function parseNonNegativeInt(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) return INVALID_NUMBER;
  return n;
}

function parsePositiveInt(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function parseClinicId(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) return INVALID_NUMBER;
  return n;
}

function parseClinicScopeId(v) {
  if (v === null || v === undefined || String(v).trim() === '') return 0;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) return INVALID_NUMBER;
  return n;
}

function toNumberOrNull(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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
    number === 50010 ||
    number === 50012 ||
    number === 2601 ||
    number === 2627 ||
    msg.includes('duplicate') ||
    msg.includes('duplicado') ||
    msg.includes('unique') ||
    (msg.includes('ya existe') && msg.includes('codigo'))
  );
}

function isInsufficientStockError(errOrMessage) {
  const msg = String(errOrMessage?.message || errOrMessage || '').toLowerCase();
  return (
    msg.includes('existencia insuficiente') ||
    msg.includes('stock insuficiente') ||
    msg.includes('insuficiente') ||
    msg.includes('cantidad excede')
  );
}

function getSqlErrorNumber(err) {
  return Number(
    err?.number ??
      err?.originalError?.info?.number ??
      err?.precedingErrors?.[0]?.number ??
      NaN
  );
}

function resolveClinicScopeId(req) {
  const queryClinicId = req.query?.idClinica ?? req.query?.clinicId;
  if (queryClinicId !== undefined) {
    return parseClinicScopeId(queryClinicId);
  }

  const headerClinicId = req.headers?.['x-clinic-id'];
  if (headerClinicId !== undefined) {
    return parseClinicScopeId(headerClinicId);
  }

  const userClinicId = req.user?.idClinica ?? req.user?.clinicId;
  if (userClinicId !== undefined && userClinicId !== null) {
    return parseClinicScopeId(userClinicId);
  }

  return 0;
}

function sanitizeInventory(row) {
  const productId = parsePositiveInt(row?.ProductId ?? row?.productId);
  const existencia = parseNonNegativeInt(row?.Existencia ?? row?.existencia);
  const idClinica = parsePositiveInt(row?.IdClinica ?? row?.idClinica ?? row?.clinicId);

  return {
    productId,
    codigo: toText(row?.Codigo ?? row?.codigo),
    nombreProducto: toText(row?.NombreProducto ?? row?.nombreProducto ?? row?.nombre_producto),
    costo_compra: toNumberOrNull(row?.Costo_Compra ?? row?.costo_compra),
    costo_venta: toNumberOrNull(row?.Costo_Venta ?? row?.costo_venta),
    existencia: existencia === null ? 0 : existencia,
    idClinica: idClinica || null,
    clinicName: toText(row?.ClinicName ?? row?.NombreClinica ?? row?.clinicName)
  };
}

async function getInventoryById(req, productId, idClinica = 0) {
  const r = await req.db
    .request()
    .input('ProductId', req.sql.Int, productId)
    .input('IdClinica', req.sql.Int, idClinica)
    .query(
      `
      SELECT TOP (1)
        ProductId,
        Codigo,
        NombreProducto,
        Costo_Compra,
        Costo_Venta,
        Existencia,
        IdClinica
      FROM dbo.InventoryProducts
      WHERE ProductId = @ProductId
        AND (@IdClinica = 0 OR IdClinica = @IdClinica)
      `
    );

  return r.recordset?.[0] || null;
}

/** GET /api/inventory?take=100 */
async function list(req, res) {
  try {
    const take = Math.min(200, Math.max(1, Number(req.query.take || 100)));
    const idClinica = resolveClinicScopeId(req);
    if (idClinica === INVALID_NUMBER) {
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const r = await req.db
      .request()
      .input('Take', req.sql.Int, take)
      .input('IdClinica', req.sql.Int, idClinica)
      .query(
        `
        SELECT TOP (@Take)
          p.ProductId,
          p.Codigo,
          p.NombreProducto,
          p.Costo_Compra,
          p.Costo_Venta,
          p.Existencia,
          p.IdClinica,
          c.Nombre AS ClinicName
        FROM dbo.InventoryProducts p
        LEFT JOIN dbo.Clinics c 
          ON c.ClinicId = p.IdClinica
        WHERE (@IdClinica = 0 OR p.IdClinica = @IdClinica)
        ORDER BY p.ProductId DESC
        `
      );

    return res.json((r.recordset || []).map((x) => sanitizeInventory(x)));
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Error' });
  }
}
/*
Request example:
GET /api/inventory?take=50
 
Response example (200):
[
  {
    "productId": 25,
    "codigo": "ARO-001",
    "nombreProducto": "Aro metalico",
    "costo_compra": 20.5,
    "costo_venta": 35, 
    "existencia": 12,
    "idClinica": 3
  }
]
*/

/** POST /api/inventory */
async function create(req, res) {
  try {
    const b = req.body || {};
    const hasExistencia = hasOwn(b, 'existencia');

    const codigo = toText(b.codigo);
    const nombreProducto = toText(b.nombreProducto ?? b.nombre_producto ?? b.nombre);
    const costoCompra = parseMoney(b.costo_compra);
    const costoVenta = parseMoney(b.costo_venta);
    const existencia = hasExistencia ? parseNonNegativeInt(b.existencia) : 0;
    const bodyClinicId = parseClinicId(b.idClinica ?? b.clinicId ?? b.id_clinica);

    let idClinica = bodyClinicId;
    if (idClinica === null) {
      const clinicScopeId = resolveClinicScopeId(req);
      if (clinicScopeId === INVALID_NUMBER) {
        return res.status(400).json({ message: 'idClinica invalido' });
      }
      idClinica = clinicScopeId === 0 ? null : clinicScopeId;
    }

    if (!codigo) return res.status(400).json({ message: 'codigo requerido' });
    if (bodyClinicId === INVALID_NUMBER) {
      return res.status(400).json({ message: 'idClinica invalido' });
    }
    if (costoCompra === INVALID_NUMBER) {
      return res.status(400).json({ message: 'costo_compra debe ser numero >= 0' });
    }
    if (costoVenta === INVALID_NUMBER) {
      return res.status(400).json({ message: 'costo_venta debe ser numero >= 0' });
    }
    if (existencia === INVALID_NUMBER || (hasExistencia && existencia === null)) {
      return res.status(400).json({ message: 'existencia debe ser entero >= 0' });
    }

    const r = await req.db
      .request()
      .input('Codigo', req.sql.NVarChar(50), codigo)
      .input('NombreProducto', req.sql.NVarChar(150), nombreProducto)
      .input('Costo_Compra', req.sql.Money, costoCompra)
      .input('Costo_Venta', req.sql.Money, costoVenta)
      .input('Existencia', req.sql.Int, existencia)
      .input('IdClinica', req.sql.Int, idClinica)
      .execute('spInventory_Create');

    const out = r.recordset?.[0];
    if (out?.ErrorMessage) {
      if (isDuplicateError(out.ErrorMessage)) {
        return res.status(409).json({ message: out.ErrorMessage });
      }
      if (isInsufficientStockError(out.ErrorMessage)) {
        return res.status(400).json({ message: out.ErrorMessage });
      }
      return res.status(400).json({ message: out.ErrorMessage });
    }

    const row = out || {
      ProductId: null,
      Codigo: codigo,
      NombreProducto: nombreProducto,
      Costo_Compra: costoCompra,
      Costo_Venta: costoVenta,
      Existencia: existencia,
      IdClinica: idClinica
    };

    return res.status(201).json(sanitizeInventory(row));
  } catch (err) {
    const number = getSqlErrorNumber(err);
    if (number === 50017) {
      return res.status(400).json({ message: err.message || 'La clinica enviada no existe.' });
    }
    if (number === 50010) {
      return res.status(409).json({ message: err.message || 'Codigo duplicado para esa clinica' });
    }
    if (isDuplicateError(err)) {
      return res.status(409).json({ message: 'Codigo duplicado' });
    }
    if (isInsufficientStockError(err)) {
      return res.status(400).json({ message: err.message || 'Existencia insuficiente' });
    }
    return res.status(500).json({ message: err.message || 'Error' });
  }
}
/*
Request example:
POST /api/inventory
{
  "codigo": "ARO-001",
  "nombreProducto": "Aro metalico",
  "costo_compra": 20.5,
  "costo_venta": 35,
  "existencia": 12,
  "idClinica": 3
}

Response example (201):
{
  "productId": 25,
  "codigo": "ARO-001",
  "nombreProducto": "Aro metalico",
  "costo_compra": 20.5,
  "costo_venta": 35,
  "existencia": 12,
  "idClinica": 3
}
*/

/** PUT /api/inventory/:id */
async function update(req, res) {
  try {
    const productId = parsePositiveInt(req.params.id);
    if (!productId) return res.status(400).json({ message: 'id invalido' });
    const idClinicaScope = resolveClinicScopeId(req);
    if (idClinicaScope === INVALID_NUMBER) {
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const b = req.body || {};
    const hasExistencia = hasOwn(b, 'existencia');
    const hasCodigo = hasOwn(b, 'codigo');
    const hasNombreProducto =
      hasOwn(b, 'nombreProducto') || hasOwn(b, 'nombre_producto') || hasOwn(b, 'nombre');
    const hasCostoCompra = hasOwn(b, 'costo_compra');
    const hasCostoVenta = hasOwn(b, 'costo_venta');
    const hasIdClinica = hasOwn(b, 'idClinica') || hasOwn(b, 'clinicId') || hasOwn(b, 'id_clinica');
    const hasUpdatableField =
      hasCodigo || hasNombreProducto || hasCostoCompra || hasCostoVenta || hasExistencia || hasIdClinica;

    if (!hasUpdatableField) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    const current = await getInventoryById(req, productId, idClinicaScope);
    if (!current) return res.status(404).json({ message: 'No encontrado' });

    const codigo = hasCodigo ? toText(b.codigo) : null;
    if (hasCodigo && !codigo) return res.status(400).json({ message: 'codigo invalido' });

    const nombreProducto = hasNombreProducto
      ? toText(b.nombreProducto ?? b.nombre_producto ?? b.nombre)
      : null;
    const costoCompra = hasCostoCompra ? parseMoney(b.costo_compra) : null;
    const costoVenta = hasCostoVenta ? parseMoney(b.costo_venta) : null;
    const existencia = hasExistencia ? parseNonNegativeInt(b.existencia) : null;
    const idClinica = hasIdClinica ? parseClinicId(b.idClinica ?? b.clinicId ?? b.id_clinica) : null;

    if (hasCostoCompra && costoCompra === INVALID_NUMBER) {
      return res.status(400).json({ message: 'costo_compra debe ser numero >= 0' });
    }
    if (hasCostoVenta && costoVenta === INVALID_NUMBER) {
      return res.status(400).json({ message: 'costo_venta debe ser numero >= 0' });
    }
    if (existencia === INVALID_NUMBER || (hasExistencia && existencia === null)) {
      return res.status(400).json({ message: 'existencia debe ser entero >= 0' });
    }
    if (hasIdClinica && idClinica === INVALID_NUMBER) {
      return res.status(400).json({ message: 'idClinica invalido' });
    }

    const r = await req.db
      .request()
      .input('ProductId', req.sql.Int, productId)
      .input('Codigo', req.sql.NVarChar(50), codigo)
      .input('NombreProducto', req.sql.NVarChar(150), nombreProducto)
      .input('Costo_Compra', req.sql.Money, costoCompra)
      .input('Costo_Venta', req.sql.Money, costoVenta)
      .input('Existencia', req.sql.Int, existencia)
      .input('IdClinica', req.sql.Int, idClinica)
      .execute('spInventory_Update');

    const out = r.recordset?.[0];
    if (out?.ErrorMessage) {
      if (isDuplicateError(out.ErrorMessage)) {
        return res.status(409).json({ message: out.ErrorMessage });
      }
      if (isInsufficientStockError(out.ErrorMessage)) {
        return res.status(400).json({ message: out.ErrorMessage });
      }
      return res.status(400).json({ message: out.ErrorMessage });
    }

    const row = out || current;

    return res.json(sanitizeInventory(row));
  } catch (err) {
    const number = getSqlErrorNumber(err);
    if (number === 50011) {
      return res.status(404).json({ message: err.message || 'No encontrado' });
    }
    if (number === 50012) {
      return res.status(409).json({ message: err.message || 'Codigo duplicado para esa clinica' });
    }
    if (number === 50013) {
      return res.status(400).json({ message: err.message || 'Existencia no puede ser negativa' });
    }
    if (number === 50017) {
      return res.status(400).json({ message: err.message || 'La clinica enviada no existe.' });
    }
    if (isDuplicateError(err)) {
      return res.status(409).json({ message: 'Codigo duplicado' });
    }
    if (isInsufficientStockError(err)) {
      return res.status(400).json({ message: err.message || 'Existencia insuficiente' });
    }
    return res.status(500).json({ message: err.message || 'Error' });
  }
}
/*
Request example:
PUT /api/inventory/25
{
  "costo_venta": 39.99,
  "existencia": 15
}

Response example (200):
{
  "productId": 25,
  "codigo": "ARO-001",
  "costo_compra": 20.5,
  "costo_venta": 39.99,
  "existencia": 15
}
*/

/** POST /api/inventory/:id/decrement */
async function decrement(req, res) {
  try {
    const productId = parsePositiveInt(req.params.id);
    if (!productId) return res.status(400).json({ message: 'id invalido' });
    const idClinicaScope = resolveClinicScopeId(req);
    if (idClinicaScope === INVALID_NUMBER) {
      return res.status(400).json({ message: 'idClinica invalido' });
    }
    const current = await getInventoryById(req, productId, idClinicaScope);
    if (!current) return res.status(404).json({ message: 'No encontrado' });

    const cantidad = parsePositiveInt(req.body?.cantidad);
    if (!cantidad) return res.status(400).json({ message: 'cantidad debe ser entero > 0' });

    const r = await req.db
      .request()
      .input('ProductId', req.sql.Int, productId)
      .input('Cantidad', req.sql.Int, cantidad)
      .execute('spInventory_Decrement');

    const out = r.recordset?.[0];
    if (out?.ErrorMessage) {
      if (isInsufficientStockError(out.ErrorMessage)) {
        return res.status(400).json({ message: out.ErrorMessage });
      }
      if (isDuplicateError(out.ErrorMessage)) {
        return res.status(409).json({ message: out.ErrorMessage });
      }
      return res.status(400).json({ message: out.ErrorMessage });
    }

    return res.json({
      ok: true,
      productId,
      cantidad,
      existencia: toNumberOrNull(out?.Existencia),
      idClinica: parsePositiveInt(current.IdClinica) || null
    });
  } catch (err) {
    if (isInsufficientStockError(err)) {
      return res.status(400).json({ message: err.message || 'Existencia insuficiente' });
    }
    if (isDuplicateError(err)) {
      return res.status(409).json({ message: err.message || 'Codigo duplicado' });
    }
    return res.status(500).json({ message: err.message || 'Error' });
  }
}
/*
Request example:
POST /api/inventory/25/decrement
{
  "cantidad": 2
}

Response example (200):
{
  "ok": true,
  "productId": 25,
  "cantidad": 2,
  "existencia": 13
}
*/

module.exports = { create, list, update, decrement };
