import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Rutas relativas: la app queda servible desde cualquier subruta o
  // desde el iframe sandbox de Google Apps Script.
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Todo el build queda plano en la raíz de dist/, sin subcarpetas.
    // Algunos despliegues por arrastre (Netlify Drop con .zip) no expanden
    // los subdirectorios y dejan los assets inalcanzables; sin carpetas
    // anidadas ese modo de fallo desaparece.
    rollupOptions: {
      output: {
        entryFileNames: "[name]-[hash].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name]-[hash][extname]",
      },
    },
  },
  optimizeDeps: {
    // onnxruntime-web carga sus WASM de forma dinámica; excluirlo evita
    // que Vite intente bundlear los loaders y rompa las rutas WASM.
    exclude: ["onnxruntime-web"],
  },
});