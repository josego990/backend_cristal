function buildRequest(db, params){
  const request = db.request();

  for(const param of params || []){
    request.input(param.name, param.type, param.value);
  }

  return request;
}

async function executeReportProcedure({ db, procedureName, params }){
  const request = buildRequest(db, params);
  return request.execute(procedureName);
}

module.exports = {
  executeReportProcedure
};
