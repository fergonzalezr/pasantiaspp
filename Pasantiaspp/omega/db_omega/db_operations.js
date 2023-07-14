const config    = require('./db_config'),
      sql       = require('mssql')

//Función que convierte un arreglo de RUNs al formato string "(RUN1, RUN2, RUN3, ...)" para ser utilizado en un Query SQL.
const arr_to_str = (arr) => {
  let str_arr = "(";
  for (i in arr){
    str_arr = str_arr.concat(`'${arr[i].RUN_Alumno}'`);
    if (i !== (arr.length - 1).toString()){
      str_arr = str_arr.concat(', ');
    }
  }
  str_arr = str_arr.concat(")");
  return str_arr;
}

//Función que retorna todos los alumnos que estén en estado Pendiente de Verificación de Requisitos (Aquellos que tengan un registro de su reglamento pero que todavía no tengan su registro de detalle pasantía).
const getAlumnosPendientes = async(RUNs, res) => {
  try {
    const pool = await sql.connect(config);
    const alumnosPendientes = await pool.request()
    .query(`SELECT RUN_Alumno, Nombres, Apellidos, Mail_UAI, Mail_Personal FROM Alumnos 
            WHERE RUN_Alumno IN ${ RUNs }`);

    return alumnosPendientes;
  }
  catch(error) {
    console.log(error);
    res.status(500).json({ error: 'ERROR: Error interno de servidor.' });
    return error;
  }
}

//Función para crear un alumno en la base de datos.
const crearAlumno = async(Alumno, res) => {
  try {
    //Verifica que el RUT tenga un formato adecuado y, en caso de no tenerlo, envía un error como respuesta al Frontend.
    const RUNRegExp = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}\-[0-9]$/;
    if (!RUNRegExp.test(Alumno.RUN_Alumno)){
      res.status(400).json({ error: 'ERROR: RUN inválido.' });
      return;
    }

    //Verifica que los campos del alumno no estén vacíos y, en caso de ser vacíos, envía un error como respuesta al Frontend.
    if (Alumno.Nombres.length === 0){
      res.status(400).json({ error: 'ERROR: Por favor ingrese su nombre.' });
      return;
    }

    if (Alumno.Apellidos.length === 0){
      res.status(400).json({ error: 'ERROR: Por favor ingrese su apellido.' });
      return;
    }

    if (Alumno.Mail_UAI.length === 0){
      res.status(400).json({ error: 'ERROR: Por favor ingrese su mail universitario.' });
      return;
    }

    if (Alumno.Mail_Personal.length === 0){
      res.status(400).json({ error: 'ERROR: Por favor ingrese su mail personal.' });
      return;
    }

    //Consulta si el alumno ya está en la base de datos, en caso de ser así, envía un error al Frontend.
    const pool = await sql.connect(config);
    const result = await pool.request()
    .query(`SELECT * FROM Alumnos
            WHERE RUN_Alumno = '${Alumno.RUN_Alumno}'`);
    
    if (result.recordset.length > 0) {
      res.status(400).json({ error: 'ERROR: Alumno ya registrado.' });
      return;
    }

    //En caso de que no se haya enviado un error, se realiza el Query para agregar al alumno a la base de datos.
    const insertAlumno = await pool.request().query(`INSERT INTO Alumnos VALUES
      ('${Alumno.RUN_Alumno}', '${Alumno.Nombres}', '${Alumno.Apellidos}', '${Alumno.Mail_UAI}', '${Alumno.Mail_Personal}', 'foo')`);
    
    res.status(201).json({ message: 'Alumno registrado exitosamente.' });
    return;
  }
  catch(error) {
    console.error(error);
    res.status(500).json({ error: 'ERROR: Error interno de servidor.' });
    return error;
  }
}

//Función para eliminar un alumno utilizando su RUT como método de filtración.
const removeAlumno = async(Alumno, res) => {
  try {
    const pool = await sql.connect(config);
    const deleteAlumno = await pool.request()
    .query(`DELETE FROM Alumnos 
            WHERE RUN_Alumno = '${Alumno.RUN_Alumno}'`);
    
    res.status(201).json({ message: 'Alumno eliminado exitosamente.' });
    return;
  }
  catch(error) {
    console.log(error);
    res.status(500).json({ error: 'ERROR: Error interno de servidor.' });
    return error;
  }
}

//verifica si  coinciden las credenciales (ajustar para mmssql)
// Verifica si coinciden las credenciales (utilizando MSSQL)
const Login_Alumno = (Mail, Clave) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT Mail_UAI, Clave FROM Alumnos WHERE Mail_UAI = @Mail AND Clave = @Clave';
    const pool = new sql.ConnectionPool(config);
    pool.connect().then((pool) => {
      return pool.request()
        .input('Mail', sql.VarChar, Mail)
        .input('Clave', sql.VarChar, Clave)
        .query(query);
    }).then((result) => {
      const isAuthenticated = result.recordset.length > 0;
      resolve(isAuthenticated);
      pool.close();
    }).catch((error) => {
      console.error('Error al ejecutar la consulta:', error);
      reject(error);
      pool.close();
    });
  });
};
// Verifica si coinciden las credenciales (utilizando MSSQL)
const Login_Admin = (Mail, Clave) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT Mail_UAI, Clave FROM Administradores WHERE Mail_UAI = @Mail AND Clave = @Clave';
    const pool = new sql.ConnectionPool(config);
    pool.connect().then((pool) => {
      return pool.request()
        .input('Mail', sql.VarChar, Mail)
        .input('Clave', sql.VarChar, Clave)
        .query(query);
    }).then((result) => {
      const isAuthenticated = result.recordset.length > 0;
      resolve(isAuthenticated);
      pool.close();
    }).catch((error) => {
      console.error('Error al ejecutar la consulta:', error);
      reject(error);
      pool.close();
    });
  });
};


// Obtiene datos del usuario a partir del mail, creada para pasar los datos al token (utilizando MSSQL)
const get_userdata = (Mail, rol) => {
  return new Promise((resolve, reject) => {
    let query;
    if (rol === 'alumno') {
      query = 'SELECT Mail_UAI, RUN_Alumno, Nombres, Apellidos FROM Alumnos WHERE Mail_UAI = @Mail';
    } else if (rol === 'admin') {
      query = 'SELECT Mail_UAI, RUN_Administrador, Nombres, Apellidos FROM Administradores WHERE Mail_UAI = @Mail';
    } else {
      reject(new Error('Invalid role'));
      return;
    }
    
    const pool = new sql.ConnectionPool(config);
    pool.connect().then((pool) => {
      return pool.request()
        .input('Mail', sql.VarChar, Mail)
        .query(query);
    }).then((result) => {
      const userData = result.recordset[0];
      resolve(JSON.stringify(userData));
      pool.close();
    }).catch((error) => {
      console.error('Error al ejecutar la consulta:', error);
      reject(error);
      pool.close();
    });
  });
};
//obtiene el mail del alumno a partir del rut
const getMailFromRut = async (RUN,res) => {
  try{
  const pool = await sql.connect(config)
  const getMail = await pool.request().query(`SELECT Mail_UAI FROM Alumnos 
  WHERE RUN_Alumno = '${RUN}'`);
  //console.log();
  res.status(200).json({mail_Alumno: getMail.recordset[0].Mail_UAI});
  return;
  }
  catch(error) {
    console.log(error);
    //res.status(500).json({ error: 'ERROR: Error interno de servidor.' });
    return error;
  }
}

module.exports = {
  arr_to_str,
  getAlumnosPendientes,
  crearAlumno,
  removeAlumno,
  Login_Alumno,
  Login_Admin,
  get_userdata,
  getMailFromRut
}