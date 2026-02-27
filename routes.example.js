// Ejemplo de cómo mapear rutas en tu Express (NO incluye app.listen ni config de server).
// Asume que ya tienes middleware que inyecta req.db y req.sql, y auth JWT que setea req.user.

const auth = require('./handlers/auth.handlers');
const dashboard = require('./handlers/dashboard.handlers');
const patients = require('./handlers/patients.handlers');
const quotations = require('./handlers/quotations.handlers');
const expenses = require('./handlers/expenses.handlers');
const users = require('./handlers/users.handlers');
const inventory = require('./handlers/inventory.handlers');
const clinics = require('./handlers/clinics.handlers');

module.exports = function registerRoutes(app, authMiddleware){
  // Auth
  app.post('/api/auth/login', auth.login);
  app.get('/api/auth/me', authMiddleware, auth.me);

  // Dashboard
  app.get('/api/dashboard/summary', authMiddleware, dashboard.summary);

  // Pacientes
  app.post('/api/patients', authMiddleware, patients.create);
  app.get('/api/patients/search', authMiddleware, patients.search);
  app.get('/api/patients/order/:orderNo', authMiddleware, patients.getByOrder);
  app.get('/api/patients/:id', authMiddleware, patients.getById);
  app.put('/api/patients/:id/lab-code', authMiddleware, patients.updateLabCode);
  app.put('/api/patients/:id/assign-lab-code', authMiddleware, patients.assignLabCode);
  app.put('/api/patients/:id/deliver', authMiddleware, patients.confirmDelivery);

  // Cotizaciones
  app.post('/api/quotations', authMiddleware, quotations.create);
  app.get('/api/quotations', authMiddleware, quotations.list);
  app.get('/api/quotations/:id', authMiddleware, quotations.getById);

  // Gastos
  app.post('/api/expenses', authMiddleware, expenses.create);
  app.get('/api/expenses', authMiddleware, expenses.list);

  // Usuarios
  app.post('/api/users', authMiddleware, users.create);
  app.get('/api/users', authMiddleware, users.list);
  app.put('/api/users/:id', authMiddleware, users.update);

  // Inventario
  app.post('/api/inventory', authMiddleware, inventory.create);
  app.get('/api/inventory', authMiddleware, inventory.list);
  app.put('/api/inventory/:id', authMiddleware, inventory.update);
  app.post('/api/inventory/:id/decrement', authMiddleware, inventory.decrement);

  // Clinicas
  app.post('/api/clinics', authMiddleware, clinics.create);
  app.get('/api/clinics', authMiddleware, clinics.list);
  app.get('/api/clinics/user/:userId', authMiddleware, clinics.listByUserId);
};
