// ============================================================
// ROSA Expert — Autenticación de usuarios
// Hoja "Metrica": A=Cédula  B=Email  C=Nombre  D=Rol  E=Estado  F=FechaRegistro
// ============================================================

function handleLogin(email, cedula) {
  if (!cedula || !/^\d{6,12}$/.test(String(cedula).trim())) {
    return { ok: false, error: 'Cédula inválida (debe tener entre 6 y 12 dígitos)' };
  }
  if (!email || typeof email !== 'string') {
    return { ok: false, error: 'Correo requerido' };
  }

  var sheet = getSheet('Metrica');
  var rows  = sheet.getDataRange().getValues();

  var cedulaNorm = String(cedula).trim();
  var emailNorm  = String(email).trim().toLowerCase();

  for (var i = 1; i < rows.length; i++) {
    var rowCedula = String(rows[i][0]).trim();
    var rowEmail  = String(rows[i][1]).trim().toLowerCase();
    var rowEstado = String(rows[i][4] || 'activo').trim().toLowerCase();

    if (rowCedula === cedulaNorm && rowEmail === emailNorm) {
      if (rowEstado !== 'activo') {
        return { ok: false, error: 'Usuario inactivo. Contacta al administrador.' };
      }
      var admins = getAdminEmails().map(function(e) { return e.toLowerCase(); });
      var esAdmin = admins.indexOf(rowEmail) !== -1
                 || String(rows[i][3]).toLowerCase() === 'admin';
      return {
        ok: true,
        data: {
          cedula:        rowCedula,
          email:         rows[i][1],
          nombre:        String(rows[i][2] || email.split('@')[0]),
          rol:           String(rows[i][3] || 'user').toLowerCase(),
          esAdmin:       esAdmin,
          fechaRegistro: String(rows[i][5] || '')
        }
      };
    }
  }

  return {
    ok: false,
    error: 'No autorizado. Verifica tu cédula y correo, o contacta al administrador.'
  };
}
