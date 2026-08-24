import { useRef, useState } from "react";

type CameraUploaderProps = {
  onImageSelected?: (file: File) => void;
};

export default function CameraUploader({
  onImageSelected,
}: CameraUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const loadImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;

      if (typeof result === "string") {
        setPreview(result);
      }
    };

    reader.readAsDataURL(file);

    onImageSelected?.(file);
  };

  return (
    <div className="mt-12">

      <h2 className="text-3xl font-bold mb-2">
        Fotografía del trabajador
      </h2>

      <p className="text-gray-500 mb-8">
        Capture o cargue una fotografía para el análisis automático.
      </p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => {
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);

          const file = event.dataTransfer.files[0];

          if (file) {
            loadImage(file);
          }
        }}
        className={`rounded-3xl border-2 border-dashed p-12 transition-all cursor-pointer ${
          dragging
            ? "border-[#006D32] bg-green-50"
            : "border-gray-300 bg-gray-50"
        }`}
      >

        {preview ? (
          <img
            src={preview}
            alt="Fotografía seleccionada"
            className="rounded-2xl w-full max-h-[650px] object-contain"
          />
        ) : (
          <div className="text-center">

            <div className="text-7xl mb-6">
              📷
            </div>

            <h3 className="text-2xl font-bold">
              Arrastre una fotografía
            </h3>

            <p className="text-gray-500 mt-3">
              o haga clic para seleccionarla
            </p>

            <div className="mt-8 inline-block bg-[#006D32] text-white px-6 py-3 rounded-xl font-semibold">
              Seleccionar imagen
            </div>

            <p className="text-sm text-gray-400 mt-6">
              JPG · PNG · WEBP
            </p>

          </div>
        )}

      </div>

      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            loadImage(file);
          }
        }}
      />

    </div>
  );
}
