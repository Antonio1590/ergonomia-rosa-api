import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getUserHistory } from "../services/SheetsService";
import type { UserHistoryEntry } from "../services/SheetsService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

const RISK_CONFIG: Record<string, { bg: string; text: string; border: string; color: string; dot: string }> = {
  Bajo:       { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200", color: "#059669", dot: "bg-green-500" },
  Medio:      { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", color: "#ca8a04", dot: "bg-yellow-500" },
  Alto:       { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",   color: "#f43f5e", dot: "bg-red-500" },
  "Muy Alto": { bg: "bg-red-100",   text: "text-red-900",    border: "border-red-400",   color: "#9f1239", dot: "bg-red-700" },
};
const RISK_FALLBACK = { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", color: "#6B7280", dot: "bg-gray-400" };
const riskCfg = (n: string) => RISK_CONFIG[n] ?? RISK_FALLBACK;

export default function HistoryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries]   = useState<UserHistoryEntry[] | null>(null);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserHistory(user.email)
      .then((list) => setEntries(Array.isArray(list) ? list : []))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar tu historial."));
  }, [user]);

  const last = entries && entries.length > 0 ? entries[entries.length - 1] : null;
  const prev = entries && entries.length > 1 ? entries[entries.length - 2] : null;

  const chartMax = useMemo(() => {
    if (!entries || entries.length === 0) return 1;
    return Math.max(...entries.map((e) => e.puntajeFinal), 1);
  }, [entries]);

  const delta = last && prev ? Math.round((last.puntajeFinal - prev.puntajeFinal) * 10) / 10 : null;

  return (
    <div className="min-h-screen bg-[#F0F7F2]">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 shadow-sm z-50 flex items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-lg bg-[#005224] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-base">accessibility_new</span>
          </button>
          <span className="text-lg font-bold text-[#005224]">Mi historial</span>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:block">{user.nombre || user.email}</span>
            <button onClick={() => navigate("/")}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition">
              Nueva evaluación
            </button>
            <button onClick={logout}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition">
              Salir
            </button>
          </div>
        )}
      </header>

      <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto">

        {error && (
          <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <span className="material-symbols-outlined text-red-500">error</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {entries === null && !error && (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size={80} label="Cargando tu historial..." />
          </div>
        )}

        {entries !== null && entries.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-gray-300">history</span>
            <p className="mt-3 font-bold text-gray-700">Aún no tienes evaluaciones guardadas</p>
            <p className="text-sm text-gray-400 mt-1">Cuando guardes tu primera evaluación, aquí verás tu progreso.</p>
            <button onClick={() => navigate("/")}
              className="mt-5 inline-flex items-center gap-2 bg-[#005224] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#006D32] transition">
              <span className="material-symbols-outlined text-base">add_a_photo</span>
              Hacer mi primera evaluación
            </button>
          </div>
        )}

        {last && (
          <>
            {/* Resumen */}
            <div className={`rounded-3xl border p-7 flex flex-col sm:flex-row items-center gap-6 mb-5 ${riskCfg(last.nivelRiesgo).bg} ${riskCfg(last.nivelRiesgo).border}`}>
              <div className="text-center">
                <p className="text-6xl font-black" style={{ color: riskCfg(last.nivelRiesgo).color }}>{last.puntajeFinal}</p>
                <p className="text-xs text-gray-400 mt-1">de 10</p>
              </div>
              <div className="text-center sm:text-left flex-1">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold mb-2 bg-white ${riskCfg(last.nivelRiesgo).text} border ${riskCfg(last.nivelRiesgo).border}`}>
                  Riesgo {last.nivelRiesgo}
                </div>
                <p className="text-sm text-gray-600">
                  Última evaluación: {new Date(last.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                {delta !== null ? (
                  delta === 0 ? (
                    <p className="text-sm text-gray-500 mt-1">Sin cambio respecto a tu evaluación anterior.</p>
                  ) : delta < 0 ? (
                    <p className="text-sm text-green-700 font-semibold mt-1">▼ Mejoraste {Math.abs(delta)} punto{Math.abs(delta) !== 1 ? "s" : ""} respecto a tu evaluación anterior.</p>
                  ) : (
                    <p className="text-sm text-orange-600 font-semibold mt-1">▲ Subió {delta} punto{delta !== 1 ? "s" : ""} respecto a tu evaluación anterior — revisa las recomendaciones.</p>
                  )
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Esta es tu primera evaluación guardada. Repítela en unas semanas para ver tu avance.</p>
                )}
              </div>
            </div>

            {/* Gráfica de evolución */}
            {entries && entries.length > 1 && (
              <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006D32]">trending_up</span>
                  Evolución de tu puntaje
                </h3>
                <div className="relative h-32 flex items-end justify-between gap-1.5 px-1">
                  <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
                    {[0, 1, 2].map((i) => <div key={i} className="w-full border-b border-gray-100" />)}
                  </div>
                  {entries.map((e, i) => {
                    const pct = e.puntajeFinal / chartMax;
                    const isLast = i === entries.length - 1;
                    const color = riskCfg(e.nivelRiesgo).color;
                    return (
                      <div key={i} className="relative flex-1 flex flex-col justify-end h-full group">
                        <div className="w-full rounded-t-lg transition-all duration-500"
                          style={{ height: `${Math.max(pct * 100, 6)}%`, backgroundColor: color, opacity: isLast ? 1 : 0.4, border: isLast ? `2px solid ${color}` : "none" }} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          {e.puntajeFinal}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista de evaluaciones */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <h3 className="font-bold text-gray-900 p-6 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006D32]">list_alt</span>
                Todas tus evaluaciones
              </h3>
              <div className="divide-y divide-gray-100">
                {[...(entries ?? [])].reverse().map((e, i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-4">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${riskCfg(e.nivelRiesgo).dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(e.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <p className="text-xs text-gray-400">
                        Silla {e.silla || "—"} · Pantalla {e.pantalla || "—"} · Teclado {e.teclado || "—"}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${riskCfg(e.nivelRiesgo).bg} ${riskCfg(e.nivelRiesgo).text}`}>
                      {e.nivelRiesgo}
                    </span>
                    <span className="text-lg font-black text-gray-800 w-8 text-right shrink-0">{e.puntajeFinal}</span>
                    {e.urlImagen && (
                      <a href={e.urlImagen} target="_blank" rel="noreferrer" className="shrink-0 text-[#006D32] hover:text-[#005224]">
                        <span className="material-symbols-outlined text-lg">image</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
