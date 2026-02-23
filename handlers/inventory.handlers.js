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
    number === 2601 ||
    number === 2627 ||
    msg.includes('duplicate') ||
    msg.includes('duplicado') ||
    msg.includes('unique')
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

function sanitizeInventory(row) {
  const productId = parsePositiveInt(row?.ProductId ?? row?.productId);
  const existencia = parseNonNegativeInt(row?.Existencia ?? row?.existencia);

  return {
    productId,
    codigo: toText(row?.Codigo ?? row?.codigo),
    costo_compra: toNumberOrNull(row?.Costo_Compra ?? row?.costo_compra),
    costo_venta: toNumberOrNull(row?.Costo_Venta ?? row?.costo_venta),
    existencia: existencia === null ? 0 : existencia
  };
}

async function getInventoryById(req, productId) {
  const r = await req.db
    .request()
    .input('ProductId', req.sql.Int, productId)
    .query(
      `
      SELECT TOP (1)
        ProductId,
        Codigo,
        Costo_Compra,
        Costo_Venta,
        Existencia
      FROM dbo.InventoryProducts
      WHERE ProductId = @ProductId
      `
    );

  return r.recordset?.[0] || null;
}

/** GET /api/inventory?take=100 */
async function list(req, res) {
  try {
    const take = Math.min(200, Math.max(1, Number(req.query.take || 100)));
    const r = await req.db
      .request()
      .input('Take', req.sql.Int, take)
      .query(
        `
        SELECT TOP (@Take)
          ProductId,
          Codigo,
          Costo_Compra,
          Costo_Venta,
          Existencia
        FROM dbo.InventoryProducts
        ORDER BY ProductId DESC
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
    "costo_compra": 20.5,
    "costo_venta": 35,
    "existencia": 12
  }
]
*/

/** POST /api/inventory */
async function create(req, res) {
  try {
    const b = req.body || {};
    const hasExistencia = hasOwn(b, 'existencia');

    const codigo = toText(b.codigo);
    const costoCompra = parseMoney(b.costo_compra);
    const costoVenta = parseMoney(b.costo_venta);
    const existencia = hasExistencia ? parseNonNegativeInt(b.existencia) : 0;

    if (!codigo) return res.status(400).json({ message: 'codigo requerido' });
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
      .input('Codigo', req.sql.NVarChar(60), codigo)
      .input('Costo_Compra', req.sql.Money, costoCompra)
      .input('Costo_Venta', req.sql.Money, costoVenta)
      .input('Existencia', req.sql.Int, existencia)
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
      Costo_Compra: costoCompra,
      Costo_Venta: costoVenta,
      Existencia: existencia
    };

    return res.status(201).json(sanitizeInventory(row));
  } catch (err) {
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
  "costo_compra": 20.5,
  "costo_venta": 35,
  "existencia": 12
}

Response example (201):
{
  "productId": 25,
  "codigo": "ARO-001",
  "costo_compra": 20.5,
  "costo_venta": 35,
  "existencia": 12
}
*/

/** PUT /api/inventory/:id */
async function update(req, res) {
  try {
    const productId = parsePositiveInt(req.params.id);
    if (!productId) return res.status(400).json({ message: 'id invalido' });

    const b = req.body || {};
    const hasExistencia = hasOwn(b, 'existencia');
    const hasUpdatableField =
      hasOwn(b, 'codigo') ||
      hasOwn(b, 'costo_compra') ||
      hasOwn(b, 'costo_venta') ||
      hasExistencia;

    if (!hasUpdatableField) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    const current = await getInventoryById(req, productId);
    if (!current) return res.status(404).json({ message: 'No encontrado' });

    const codigo = hasOwn(b, 'codigo') ? toText(b.codigo) : toText(current.Codigo);
    if (!codigo) return res.status(400).json({ message: 'codigo invalido' });

    const costoCompra = hasOwn(b, 'costo_compra')
      ? parseMoney(b.costo_compra)
      : parseMoney(current.Costo_Compra);
    const costoVenta = hasOwn(b, 'costo_venta')
      ? parseMoney(b.costo_venta)
      : parseMoney(current.Costo_Venta);
    const existencia = hasExistencia
      ? parseNonNegativeInt(b.existencia)
      : parseNonNegativeInt(current.Existencia);

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
      .input('ProductId', req.sql.Int, productId)
      .input('Codigo', req.sql.NVarChar(60), codigo)
      .input('Costo_Compra', req.sql.Money, costoCompra)
      .input('Costo_Venta', req.sql.Money, costoVenta)
      .input('Existencia', req.sql.Int, existencia)
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

    const row = out || {
      ProductId: productId,
      Codigo: codigo,
      Costo_Compra: costoCompra,
      Costo_Venta: costoVenta,
      Existencia: existencia
    };

    return res.json(sanitizeInventory(row));
  } catch (err) {
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
      existencia: toNumberOrNull(out?.Existencia)
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
