/**
 * GET /api/dashboard/summary
 *
 * recordsets:
 *  0: KPIs
 *  1: pending list
 */
async function summary(req, res){
  try{
    const r = await req.db.request().execute('spDashboard_Summary');

    const k = r.recordsets?.[0]?.[0] || {};
    const pending = r.recordsets?.[1] || [];

    return res.json({
      kpis: {
        totalPatients: k.TotalPatients ?? 0,
        pendingDeliveries: k.PendingDeliveries ?? 0,
        pendingBalance: Number(k.PendingBalance ?? 0)
      },
      pending: pending.map(x=>({
        patientId: x.PatientId,
        orderNo: x.OrderNo,
        examDate: x.ExamDate,
        name: x.Name,
        phone: x.Phone,
        balance: Number(x.Balance ?? 0),
        labCode: x.LabCode
      }))
    });
  }catch(err){
    return res.status(500).json({ message: err.message || 'Error' });
  }
}

module.exports = { summary };
