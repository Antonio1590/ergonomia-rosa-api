import { useState } from "react";

import ChairAnalysis from "../dashboard/ChairAnalysis";
import CameraUploader from "../camera/CameraUploader";
import PoseTester from "../ai/PoseTester";
import { ErrorBoundary } from "../common/ErrorBoundary";
import DraftBanner from "../draft/DraftBanner";

const IMG_LATERAL = "https://lh3.googleusercontent.com/aida-public/AB6AXuA6OWP8UhdW9-OcNe2tk3kPWpUkqb0U-ec8MdDTKiX6kGxV5sn_-gYMcotMhd987ix0XaA4VR5523Hbbl6OrI1n0oe3ppguU0g9sxG44-cvmcY-_GnFJ2s_zzCLtgH4cGioH7o_dsDfj28NpVL9YQ0vHv3GTaCOyokr-jQx97WVjqsLxqYfTo-HzVtIe2hxBrEv2_nANvxdOh6yOlFhQF1_e7BZ4fjGwHuVE5dNO-8VYNLsF0hp2M4KKJ0p6FrfMmsGKQ";
const IMG_DESK    = "https://lh3.googleusercontent.com/aida-public/AB6AXuAVgR8riq_M2Gr7x-Sd5PAsk4twUKIEOXlbh7WOHDMNQTsWfB3ZvCG2a4iQXvO9K-xIVVXOSi3eCrfwiKhHFkKRW4iXjOSwrNItbgH__IuUOz_U8DQhj3YmwhJ89l3Kdt3n3HQn0Cg2lvkkereWauOoOYoLhrPZR9AFBlwyDzJOoK3funfBjEH5WjP6_4jR-dGgDnrgtWjimeQHEa9CM13f3b7jDwN4kaf3gQpOS2XcUlDyeeEuDNaDIFTsAV1hVjefRg";

export default function Step1Chair() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [guideAccepted, setGuideAccepted] = useState(false);

  if (!guideAccepted) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#0b1c30]">Guía de Fotografía</h2>
          <p className="text-gray-500 mt-2">Siga estas instrucciones para garantizar un análisis ergonómico preciso.</p>
        </div>

        {/* Foto 1 — Postura Lateral */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative min-h-64 bg-gray-100 overflow-hidden">
              <img
                src={IMG_LATERAL}
                alt="Postura Lateral Ideal"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-[#005224] text-white px-3 py-1 rounded-full text-xs font-bold">
                Referencia de Postura
              </div>
            </div>
            <div className="p-6 lg:p-8 flex flex-col justify-center">
              <span className="text-[#FF6B00] font-bold text-xs uppercase tracking-widest mb-2">Paso 1</span>
              <h3 className="text-xl font-bold text-[#0b1c30] mb-5">Foto 1: Postura Lateral Completa</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006D32] mt-0.5">distance</span>
                  <p className="text-gray-600">Tomar la foto lejos del escritorio para capturar todo el perfil.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006D32] mt-0.5">horizontal_distribute</span>
                  <p className="text-gray-600">Los pies deben tocar totalmente el piso (o usar reposapiés).</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006D32] mt-0.5">accessibility_new</span>
                  <p className="text-gray-600">Rodillas y cadera en posición neutra. Mirar siempre al frente.</p>
                </div>
                <div className="mt-2 p-3 bg-orange-50 rounded-lg border-l-4 border-[#FF6B00]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[#FF6B00] text-base">groups</span>
                    <span className="text-xs font-bold text-[#FF6B00]">Requerimiento</span>
                  </div>
                  <p className="text-xs text-gray-600">Debe ayudarte otra persona en cuclillas, con el celular perpendicular al piso.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Foto 2 — Superficie de trabajo */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-6 lg:p-8 flex flex-col justify-center order-2 lg:order-1">
              <span className="text-[#FF6B00] font-bold text-xs uppercase tracking-widest mb-2">Paso 2</span>
              <h3 className="text-xl font-bold text-[#0b1c30] mb-4">Foto 2: Superficie de Trabajo</h3>
              <p className="text-gray-500 mb-5">Esta toma permite evaluar la interacción con las herramientas de trabajo.</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006D32] mt-0.5">photo_camera</span>
                  <p className="text-gray-600">Foto a la altura de la superficie de trabajo.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006D32] mt-0.5">visibility</span>
                  <p className="text-gray-600">Debe verse la postura de antebrazos, el uso de teclado y mouse externo.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006D32] mt-0.5">monitor</span>
                  <p className="text-gray-600">Asegúrese de que la pantalla sea visible en la misma toma.</p>
                </div>
              </div>
            </div>
            <div className="relative min-h-56 bg-gray-100 overflow-hidden order-1 lg:order-2">
              <img
                src={IMG_DESK}
                alt="Superficie de trabajo"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 right-4 bg-[#FF6B00] text-white px-3 py-1 rounded-full text-xs font-bold">
                Ejemplo de Captura
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setGuideAccepted(true)}
          className="w-full bg-[#FF6B00] hover:bg-[#E05A00] text-white py-3 px-6 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg"
        >
          Entendido, continuar con el análisis
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <DraftBanner />
      <ChairAnalysis />
      <CameraUploader onImageSelected={(file) => setSelectedImage(file)} />
      <ErrorBoundary message="No se pudo inicializar el análisis de postura. Intenta recargar la página.">
        <PoseTester imageFile={selectedImage} />
      </ErrorBoundary>
    </>
  );
}
