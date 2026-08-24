// ============================================================
// ROSA Expert — Almacenamiento de fotos en Google Drive
// Estructura: "ROSA Expert - Fotos" / <email> / <archivo>
// ============================================================
var DRIVE_ROOT = 'ROSA Expert - Fotos';

function handleUploadPhoto(params) {
  if (!params || !params.base64) return { ok: false, error: 'Sin datos de imagen' };

  var email    = String(params.email || 'anonimo').trim().toLowerCase();
  var mime     = params.mimeType || 'image/jpeg';
  var stamp    = Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd_HH-mm-ss');
  var original = String(params.nombreArchivo || 'foto.jpg').replace(/[^\w.\-]/g, '_');
  var fileName = stamp + '__' + original;

  var root       = getOrCreateFolder(DriveApp.getRootFolder(), DRIVE_ROOT);
  var userFolder = getOrCreateFolder(root, email);
  var bytes      = Utilities.base64Decode(params.base64);
  var blob       = Utilities.newBlob(bytes, mime, fileName);
  var file       = userFolder.createFile(blob);

  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (_) {
    // Algunas cuentas corporativas restringen el uso compartido: no es crítico
  }

  return {
    ok: true,
    data: {
      fileId: file.getId(),
      url:    'https://drive.google.com/file/d/' + file.getId() + '/view',
      nombre: fileName
    }
  };
}

function getOrCreateFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

/**
 * Ejecutar UNA VEZ desde el editor (Ejecutar > autorizarDrive)
 * para conceder el permiso de DriveApp.
 */
function autorizarDrive() {
  var carpeta = getOrCreateFolder(DriveApp.getRootFolder(), DRIVE_ROOT);
  Logger.log('Carpeta lista: ' + carpeta.getName() + ' | ID: ' + carpeta.getId());
  return carpeta.getId();
}
