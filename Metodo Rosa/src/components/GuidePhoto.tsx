import { useState } from "react";

/*
 * Fotografía de ejemplo para la guía.
 * Las imágenes viven en public/guia/ y se sirven con la base de despliegue,
 * de modo que siguen resolviendo bajo Apps Script o cualquier subruta.
 *
 * Las dos fotos tienen orientaciones distintas (vertical y horizontal), así
 * que se enmarcan a una altura común con object-contain: ambas tarjetas
 * quedan alineadas y ninguna imagen se recorta — la postura completa y el
 * puesto entero deben verse íntegros.
 */

export default function GuidePhoto({
  file,
  alt,
  badge,
  badgeColor = "bg-[#005224]",
}: {
  file: string;
  alt: string;
  badge: string;
  badgeColor?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = `${import.meta.env.BASE_URL}${file}`;

  return (
    <figure className="relative m-0 w-full h-[360px] sm:h-[440px] lg:h-[470px] overflow-hidden rounded-2xl bg-[#EDF3EF]">
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <span className="material-symbols-outlined text-4xl text-[#9CB3A5]">image</span>
          <p className="text-sm font-semibold text-[#4A6155]">Fotografía de ejemplo</p>
          <p className="text-xs text-[#7B9184]">
            Guarda la imagen como <code className="font-mono">public/{file}</code>
          </p>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="eager"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}

      <figcaption
        className={`absolute left-4 top-4 rounded-full ${badgeColor} px-3 py-1 text-xs font-bold text-white shadow-md`}
      >
        {badge}
      </figcaption>
    </figure>
  );
}
