import { useEffect, useState } from "react";
import { getAllEvaluations, getAllUsers } from "../services/SheetsService";
import type { EvaluationRecord, AppUser } from "../services/SheetsService";
import { useAuth } from "../context/useAuth";

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuByJtTqKg9SFMqcyHasdmfw6doLesbtyANLvXfD648XyYw57bJEwRwzxSt508qmP0BXNb0MN4iUgglERzio9cRDlGFw8odpA0ZBE9JMD5oUskBQuzdNK0rsk7F9LM9z1dZi-dpbX-TN4QLGhJcLYNSf24r89ScOg4c7xfSl3NjJfoj9WDoxuEyrUuQYWQWQQJhmPHFDol_2Y3U9Uc3wipSI29MLw5RjhlQLWT1tU5i7sNYMjNWVPuPttT84LnRweAcz427dbypJO2Y";

type Tab = "evaluaciones" | "usuarios";

const RISK_CONFIG: Record<string, { badge: string; dot: string }> = {
  Bajo:       { badge: "bg-green-50 text-green-700 border border-green-200",   dot: "bg-green-500" },
  Medio:      { badge: "bg-yellow-50 text-yellow-700 border border-yellow-200", dot: "bg-yellow-500" },
  Alto:       { badge: "bg-red-50 text-red-700 border border-red-200",          dot: "bg-red-500" },
  "Muy Alto": { badge: "bg-red-100 text-red-900 border border-red-400 font-bold", dot: "bg-red-700" },
};

function scoreColor(s: number) {
  if (s <= 4) return "text-[#005224]";
  if (s <= 5) return "text-orange-600";
  return "text-red-600";
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [users, setUsers]             = useState<AppUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [tab, setTab]                 = useState<Tab>("evaluaciones");

  useEffect(() => {
    Promise.all([getAllEvaluations(), getAllUsers()])
      .then(([evals, usrs]) => { setEvaluations(evals); setUsers(usrs); })
      .catch((err) => setError(err instanceof Error ? err.message : "Error cargando datos"))
      .finally(() => setLoading(false));
  }, []);

  const avgScore  = evaluations.length > 0
    ? evaluations.reduce((s, e) => s + e.puntajeFinal, 0) / evaluations.length : 0;
  const highRisk  = evaluations.filter((e) => e.puntajeFinal >= 5).length;
  const lastScore = evaluations.length > 0 ? evaluations[evaluations.length - 1].puntajeFinal : null;
  const lastRisk  = evaluations.length > 0 ? evaluations[evaluations.length - 1].nivelRiesgo : "—";

  /* bar chart — últimas 6 evaluaciones */
  const chartData = evaluations.slice(-6);
  const chartMax  = Math.max(...chartData.map((e) => e.puntajeFinal), 1);

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm h-16 flex items-center">
        <div className="flex justify-between items-center w-full px-6 lg:px-10 max-w-[1280px] mx-auto">
          <span className="text-xl font-bold text-[#005224]">ROSA Expert</span>
          <nav className="hidden md:flex items-center gap-8">
            {["Panel", "Evaluaciones", "Usuarios"].map((n) => (
              <span key={n} className="text-sm font-semibold text-gray-500 hover:text-[#005224] cursor-pointer transition-colors">{n}</span>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 transition">
              <span className="material-symbols-outlined text-gray-500">notifications</span>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition">
              <span className="material-symbols-outlined text-gray-500">help_outline</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#9bf7ac] flex items-center justify-center ml-1">
              <span className="material-symbols-outlined text-[#005224] text-base">account_circle</span>
            </div>
            <span className="text-sm text-gray-600 hidden sm:block ml-1">{user?.nombre || user?.email}</span>
            <button onClick={logout} className="ml-2 text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition">Salir</button>
          </div>
        </div>
      </header>

      <div className="flex pt-16 min-h-screen">

        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-64px)] w-72 flex-col bg-[#eff4ff] border-r border-gray-200 px-3 py-6 overflow-y-auto">
          <div className="px-3 mb-8">
            <h2 className="text-lg font-bold text-[#005224]">Panel de Administración</h2>
            <p className="text-xs text-gray-500 mt-1">Seguros Bolívar — ROSA Expert</p>
          </div>
          <nav className="flex flex-col gap-1 flex-1">
            {[
              { icon: "dashboard",  label: "Resumen general",    active: true  },
              { icon: "bar_chart",  label: "Evaluaciones",       active: false },
              { icon: "group",      label: "Usuarios",            active: false },
              { icon: "analytics",  label: "Reportes",           active: false },
            ].map(({ icon, label, active }) => (
              <div key={label}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer font-semibold text-sm transition
                  ${active ? "bg-[#006D32] text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}>
                <span className="material-symbols-outlined text-lg">{icon}</span>
                {label}
              </div>
            ))}
          </nav>
          <div className="mt-auto p-3">
            <button className="w-full py-2.5 px-4 bg-[#FF6B00] text-white rounded-xl font-semibold text-sm hover:bg-[#E05A00] transition flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-base">add</span>
              Nueva evaluación
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 lg:ml-72 p-6 lg:p-10 space-y-8 max-w-[1280px] mx-auto w-full">

          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0b1c30]">Panel Ergonómico</h1>
              <p className="text-gray-500 mt-1">Monitoreo en tiempo real de evaluaciones ROSA — Seguros Bolívar</p>
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-full text-sm">
              <span className="px-4 py-1.5 bg-[#006D32] text-white rounded-full font-semibold">Vista mensual</span>
              <span className="px-4 py-1.5 text-gray-500 font-semibold cursor-pointer">Vista trimestral</span>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
              <span className="material-symbols-outlined text-red-500">error</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* ── KPI Bento grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Score card */}
            <div className="md:col-span-4 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Último puntaje ROSA</span>
                <span className="material-symbols-outlined text-[#005224]">verified_user</span>
              </div>
              <div className="py-8 text-center">
                {loading ? (
                  <div className="text-4xl font-black text-gray-300">—</div>
                ) : (
                  <>
                    <div className={`text-[64px] font-black leading-none ${scoreColor(lastScore ?? 0)}`}>
                      {lastScore ?? "—"}
                    </div>
                    <div className={`inline-flex items-center gap-1 mt-3 px-4 py-1.5 rounded-full border text-sm font-bold ${RISK_CONFIG[lastRisk]?.badge ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {lastRisk}
                    </div>
                  </>
                )}
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {evaluations.length > 0
                    ? `Última evaluación: ${new Date(evaluations[evaluations.length - 1].fecha).toLocaleDateString("es-CO")}`
                    : "Sin evaluaciones aún"}
                </p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="md:col-span-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Historial de puntajes</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#005224]" />
                  <span className="text-xs text-gray-500">Índice ROSA</span>
                </div>
              </div>
              {loading ? (
                <div className="h-40 flex items-center justify-center text-gray-300 text-sm">Cargando...</div>
              ) : chartData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-300 text-sm">Sin datos</div>
              ) : (
                <div className="relative h-40 flex items-end justify-between gap-2 px-2">
                  {/* grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="w-full border-b border-gray-100" />
                    ))}
                  </div>
                  {chartData.map((ev, i) => {
                    const pct = ev.puntajeFinal / chartMax;
                    const isLast = i === chartData.length - 1;
                    const color = ev.puntajeFinal <= 4 ? "#005224" : ev.puntajeFinal <= 5 ? "#ea580c" : "#dc2626";
                    return (
                      <div key={i} className="relative flex-1 flex flex-col justify-end h-full group">
                        <div
                          className="w-full rounded-t-lg transition-all duration-500 relative"
                          style={{ height: `${Math.max(pct * 100, 8)}%`, backgroundColor: color, opacity: isLast ? 1 : 0.4, border: isLast ? `2px solid ${color}` : "none" }}
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            {ev.puntajeFinal}
                          </div>
                        </div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap">
                          {new Date(ev.fecha).toLocaleDateString("es-CO", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-8" />
            </div>

            {/* KPI tiles */}
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "group",         label: "Usuarios",           value: loading ? "…" : users.length,              color: "#005224" },
                { icon: "assignment",    label: "Evaluaciones totales", value: loading ? "…" : evaluations.length,       color: "#005224" },
                { icon: "trending_up",   label: "Puntaje promedio",   value: loading ? "…" : avgScore.toFixed(1),        color: "#ea580c" },
                { icon: "warning",       label: "Riesgo alto o mayor", value: loading ? "…" : highRisk,                 color: "#dc2626" },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF7F2] flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg" style={{ color }}>{icon}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-black" style={{ color }}>{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Station health */}
            <div className="md:col-span-4 bg-[#d3e4fe] border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Salud del sistema</h3>
              <div className="space-y-4 relative z-10">
                {[
                  { label: "Cobertura de evaluaciones", pct: Math.min(evaluations.length * 10, 100), color: "#005224" },
                  { label: "Usuarios activos evaluados", pct: users.length > 0 ? Math.min(Math.round(evaluations.length / users.length * 100), 100) : 0, color: "#FF6B00" },
                ].map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">{label}</span>
                      <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-0 right-0 opacity-10 text-[120px]">
                <span className="material-symbols-outlined">clinical_notes</span>
              </div>
            </div>
          </div>

          {/* ── Tablas ── */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-[#0b1c30]">Datos del sistema</h3>
              <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 text-sm">
                {(["evaluaciones", "usuarios"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 rounded-lg font-semibold transition capitalize
                      ${tab === t ? "bg-[#006D32] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
                  <p className="mt-3 text-sm">Cargando datos...</p>
                </div>
              ) : tab === "evaluaciones" ? (
                evaluations.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">No hay evaluaciones registradas aún.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#eff4ff] border-b border-gray-200">
                          {["Fecha", "Nombre", "Cédula", "Puntaje", "Nivel de riesgo", "Objetos detectados"].map((h) => (
                            <th key={h} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {evaluations.map((ev, i) => {
                          const cfg = RISK_CONFIG[ev.nivelRiesgo];
                          return (
                            <tr key={i} className="hover:bg-[#f8f9ff] transition">
                              <td className="px-5 py-4 text-sm text-gray-500">
                                {new Date(ev.fecha).toLocaleDateString("es-CO")}
                              </td>
                              <td className="px-5 py-4 font-semibold text-sm text-gray-900">{ev.nombre || "—"}</td>
                              <td className="px-5 py-4 text-sm text-gray-500">{ev.cedula || "—"}</td>
                              <td className="px-5 py-4">
                                <span className={`text-lg font-black ${scoreColor(ev.puntajeFinal)}`}>{ev.puntajeFinal}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg?.badge ?? "bg-gray-100 text-gray-700"}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot ?? "bg-gray-400"}`} />
                                  {ev.nivelRiesgo}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-xs text-gray-400">{ev.objetosDetectados || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                users.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">No hay usuarios registrados aún.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#eff4ff] border-b border-gray-200">
                          {["Nombre", "Cédula", "Email", "Rol", "Fecha registro", "Estado"].map((h) => (
                            <th key={h} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map((u, i) => (
                          <tr key={i} className="hover:bg-[#f8f9ff] transition">
                            <td className="px-5 py-4 font-semibold text-sm text-gray-900">{u.nombre}</td>
                            <td className="px-5 py-4 text-sm text-gray-500">{u.cedula}</td>
                            <td className="px-5 py-4 text-sm text-gray-500">{u.email}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border
                                ${u.rol === "admin"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                                {u.rol}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-500">
                              {u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString("es-CO") : "—"}
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 text-xs text-green-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Activo
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </section>

          {/* ── Hero section ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[#006D32] text-white rounded-3xl overflow-hidden shadow-lg p-8 lg:p-10">
            <div className="space-y-5">
              <h2 className="text-2xl font-black leading-tight">Evaluación Clínica<br />de Precisión</h2>
              <p className="text-white/80 text-sm leading-relaxed">
                La metodología ROSA permite identificar estresores ergonómicos específicos antes de que se conviertan en trastornos musculoesqueléticos crónicos. El monitoreo continuo es el primer paso hacia la salud física a largo plazo.
              </p>
              <div className="flex gap-3">
                <button className="px-5 py-2.5 bg-[#9bf7ac] text-[#00210b] font-bold rounded-xl text-sm hover:scale-105 transition-transform">
                  Nueva evaluación
                </button>
                <button className="px-5 py-2.5 border border-white/40 text-white font-bold rounded-xl text-sm hover:bg-white/10 transition">
                  Documentación
                </button>
              </div>
            </div>
            <div className="relative h-56 md:h-64 rounded-2xl overflow-hidden shadow-2xl">
              <img src={HERO_IMG} alt="Puesto ergonómico" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </section>

        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="w-full bg-[#dce9ff] border-t border-gray-200 lg:ml-0">
        <div className="max-w-[1280px] mx-auto py-10 px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="text-lg font-bold text-[#005224] mb-1">ROSA Expert</div>
            <p className="text-sm text-gray-500">© 2024 Sistema Ergonómico ROSA — Seguros Bolívar</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            {["Política de privacidad", "Documentación", "Contactar especialista", "Términos de uso"].map((l) => (
              <a key={l} href="#" className="hover:text-[#FF6B00] transition">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
