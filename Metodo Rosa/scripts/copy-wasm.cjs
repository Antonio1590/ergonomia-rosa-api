const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../node_modules/onnxruntime-web/dist');
const dst = path.resolve(__dirname, '../public');

if (!fs.existsSync(src)) {
  console.error('ERROR: node_modules/onnxruntime-web/dist no existe. Ejecuta npm install primero.');
  process.exit(1);
}

const files = fs.readdirSync(src).filter(f => f.endsWith('.wasm'));
if (files.length === 0) {
  console.error('ERROR: No se encontraron archivos .wasm en', src);
  process.exit(1);
}

files.forEach(f => {
  const from = path.join(src, f);
  const to = path.join(dst, f);
  fs.copyFileSync(from, to);
  const size = (fs.statSync(to).size / 1024 / 1024).toFixed(1);
  console.log(`Copiado: ${f} (${size} MB)`);
});

console.log(`\n✓ ${files.length} archivo(s) WASM copiado(s) a public/`);
