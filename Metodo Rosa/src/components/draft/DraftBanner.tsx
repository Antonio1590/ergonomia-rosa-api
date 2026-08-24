import { useDraft } from "../../hooks/useDraft";

export default function DraftBanner() {
  const { hasDraft, draftDate, discardDraft } = useDraft();

  if (!hasDraft) return null;

  const fecha = draftDate
    ? new Date(draftDate).toLocaleString("es-CO")
    : "fecha desconocida";

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-[#006D32] bg-green-50 p-4 flex items-center justify-between">
      <div>
        <p className="font-semibold text-[#005224]">Tienes un borrador guardado</p>
        <p className="text-sm text-gray-600">Guardado el {fecha}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={discardDraft}
          className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          Descartar
        </button>
      </div>
    </div>
  );
}
