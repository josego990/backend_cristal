const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function assertBody(req, fields){
  for(const f of fields){
    if(req.body?.[f] === undefined || req.body?.[f] === null || String(req.body[f]).trim()===''){
      const e = new Error(`Falta campo: ${f}`);
      e.status = 400;
      throw e;
    }
  }
}

/**
 * POST /api/auth/login
 * body: { username, password }
 *
 * Requisitos:
 * - req.db = mssql.ConnectionPool
 * - spAuth_GetUserByUsername
 */
async function login(req, res){
  try{
    assertBody(req, ['username','password']);

    const username = String(req.body.username).trim();
    const password = String(req.body.password);

    const r = await req.db.request()
      .input('Username', req.sql.NVarChar(60), username)
      .execute('spAuth_GetUserByUsername');

    const user = r.recordset?.[0];
    if(!user || !user.IsActive){
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.PasswordHash);
    if(!ok){
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const secret = process.env.JWT_SECRET || 'DEV_ONLY_CHANGE_ME';
    const token = jwt.sign(
      { sub: user.UserId, username: user.Username, name: user.FullName },
      secret,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: { userId: user.UserId, username: user.Username, name: user.FullName }
    });

  }catch(err){
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Error' });
  }
}

/**
 * GET /api/auth/me
 * Requiere middleware JWT que setee req.user
 */
async function me(req, res){
  return res.json({ user: req.user || null });
}

module.exports = { login, me };
