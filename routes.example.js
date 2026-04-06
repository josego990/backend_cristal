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
const reports = require('./handlers/reports.handlers');

module.exports = function registerRoutes(app, authMiddleware){
  // Auth
  app.post('/api/auth/login', auth.login);
  app.get('/api/auth/me', authMiddleware, auth.me);

  // Dashboard
  app.get('/api/dashboard/summary', authMiddleware, dashboard.summary);

  // Reportes
  app.get('/api/reports/patients/revenue-by-day', authMiddleware, reports.patientsRevenueByDay);
  app.get('/api/reports/patients/orders-list', authMiddleware, reports.patientsOrdersList);
  app.get('/api/reports/patients/pending-deliveries', authMiddleware, reports.patientsPendingDeliveries);
  app.get('/api/reports/patients/receivables', authMiddleware, reports.patientsReceivables);
  app.get('/api/reports/quotations/by-day', authMiddleware, reports.quotationsByDay);
  app.get('/api/reports/inventory/valuation', authMiddleware, reports.inventoryValuation);
  app.get('/api/reports/inventory/low-stock', authMiddleware, reports.inventoryLowStock);
  app.get('/api/reports/expenses/by-day', authMiddleware, reports.expensesByDay);
  app.get('/api/reports/expenses/detail', authMiddleware, reports.expensesDetail);

  // Pacientes
  app.post('/api/patients', authMiddleware, patients.create);
  app.get('/api/patients/search', authMiddleware, patients.search);
  app.get('/api/patients/order/:orderNo', authMiddleware, patients.getByOrder);
  app.get('/api/patients/:id', authMiddleware, patients.getById);
  app.put('/api/patients/:id', authMiddleware, patients.update);
  app.put('/api/patients/:id/lab-code', authMiddleware, patients.updateLabCode);
  app.put('/api/patients/:id/assign-lab-code', authMiddleware, patients.assignLabCode);
  app.put('/api/patients/:id/deliver', authMiddleware, patients.confirmDelivery);

  // Cotizaciones
  app.post('/api/quotations', authMiddleware, quotations.create);
  app.get('/api/quotations', authMiddleware, quotations.list);
  app.get('/api/quotations/:id', authMiddleware, quotations.getById);
  app.delete('/api/quotations/:id', authMiddleware, quotations.remove);

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
  app.put('/api/clinics/:id', authMiddleware, clinics.update);
  app.get('/api/clinics/user/:userId', authMiddleware, clinics.listByUserId);
};

/*
curl examples:

curl -X GET "http://localhost:3000/api/reports/patients/revenue-by-day?dateFrom=2026-02-14&dateTo=2026-03-15&idClinica=0" -H "Authorization: Bearer TU_TOKEN"
curl -X GET "http://localhost:3000/api/reports/patients/orders-list?dateFrom=2026-02-14&dateTo=2026-03-15&idClinica=2&query=Juan" -H "Authorization: Bearer TU_TOKEN"
curl -X GET "http://localhost:3000/api/reports/patients/pending-deliveries?take=50&idClinica=2" -H "Authorization: Bearer TU_TOKEN"
curl -X GET "http://localhost:3000/api/reports/patients/receivables?take=100&idClinica=2" -H "Authorization: Bearer TU_TOKEN"
curl -X GET "http://localhost:3000/api/reports/quotations/by-day?dateFrom=2026-02-14&dateTo=2026-03-15&idClinica=2" -H "Authorization: Bearer TU_TOKEN"
curl -X GET "http://localhost:3000/api/reports/inventory/valuation?idClinica=2" -H "Authorization: Bearer TU_TOKEN"
curl -X GET "http://localhost:3000/api/reports/inventory/low-stock?threshold=3&take=200&idClinica=2" -H "Authorization: Bearer TU_TOKEN"
curl -X GET "http://localhost:3000/api/reports/expenses/by-day?dateFrom=2026-02-14&dateTo=2026-03-15&idClinica=2" -H "Authorization: Bearer TU_TOKEN"
curl -X GET "http://localhost:3000/api/reports/expenses/detail?dateFrom=2026-02-14&dateTo=2026-03-15&idClinica=2" -H "Authorization: Bearer TU_TOKEN"
*/
