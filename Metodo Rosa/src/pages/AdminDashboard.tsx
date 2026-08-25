import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllEvaluations, getAllUsers, parseDetalles } from "../services/SheetsService";
import type { EvaluationRecord, AppUser } from "../services/SheetsService";
import { useAuth } from "../context/useAuth";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

type View = "resumen" | "evaluaciones" | "usuarios" | "reportes";
type ChartView = "mensual" | "trimestral";
type SortKey = "fecha" | "puntajeFinal";

// Mismos colores que AppsScript/JS_Rosa.html (nivelRiesgo) y los ya usados
// en AutoEvaluationPage.tsx — una sola paleta de riesgo en todo el sistema.
const RISK_CONFIG: Record<string, { badge: string; dot: string; hex: string }> = {
  Bajo:       { badge: "bg-green-50 text-green-700 border border-green-200",     dot: "bg-green-500", hex: "#059669" },
  Medio:      { badge: "bg-yellow-50 text-yellow-700 border border-yellow-200",  dot: "bg-yellow-500", hex: "#CA8A04" },
  Alto:       { badge: "bg-red-50 text-red-700 border border-red-200",          dot: "bg-red-500",    hex: "#F43F5E" },
  "Muy Alto": { badge: "bg-red-100 text-red-900 border border-red-400 font-bold", dot: "bg-red-700",   hex: "#9F1239" },
};
// Filas guardadas antes de la unificación de escala (ver docs/CHANGELOG.md)
// pueden traer etiquetas antiguas (p. ej. "Mejorable") — no deben romper
// el render, solo mostrarse en gris neutro.
const RISK_FALLBACK = { badge: "bg-gray-100 text-gray-600 border border-gray-200", dot: "bg-gray-400", hex: "#6B7280" };
const riskCfg = (nivel: string) => RISK_CONFIG[nivel] ?? RISK_FALLBACK;

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [users, setUsers]             = useState<AppUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const [view, setView]           = useState<View>("resumen");
  const [chartView, setChartView] = useState<ChartView>("mensual");

  const [evalQuery, setEvalQuery] = useState("");
  const [evalRisk, setEvalRisk]   = useState("todos");
  const [evalSort, setEvalSort]   = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "fecha", dir: "desc" });

  const [userQuery, setUserQuery] = useState("");
  const [userRole, setUserRole]   = useState("todos");
  const [selectedEval, setSelectedEval] = useState<EvaluationRecord | null>(null);

  useEffect(() => {
    Promise.all([getAllEvaluations(), getAllUsers()])
      .then(([evals, usrs]) => {
        // Defensivo: si el servidor responde ok:true sin "data" (o con un
        // tipo inesperado), no dejar el estado en undefined — eso hacía
        // fallar cualquier .filter()/.map() posterior con la app ya
        // autenticada, mostrando el ErrorBoundary en vez de datos vacíos.
        setEvaluations(Array.isArray(evals) ? evals : []);
        setUsers(Array.isArray(usrs) ? usrs : []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error cargando datos"))
      .finally(() => setLoading(false));
  }, []);

  function goTo(v: View) {
    setView(v);
    document.getElementById("panel-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ── KPIs (siempre sobre el total, no sobre el filtro) ── */
  const avgScore  = evaluations.length > 0
    ? evaluations.reduce((s, e) => s + e.puntajeFinal, 0) / evaluations.length : 0;
  const highRisk  = evaluations.filter((e) => e.puntajeFinal >= 5).length;
  const lastEval  = evaluations.length > 0 ? evaluations[evaluations.length - 1] : null;

  /* ── Historial: mensual (últimas evaluaciones) o trimestral (promedio por mes) ── */
  const chartData = useMemo(() => {
    if (chartView === "mensual") {
      return evaluations.slice(-6).map((e) => ({
        valor: e.puntajeFinal,
        color: riskCfg(e.nivelRiesgo).hex,
        etiqueta: new Date(e.fecha).toLocaleDateString("es-CO", { month: "short", day: "numeric" }),
      }));
    }
    const meses = new Map<string, { suma: number; n: number; fecha: Date }>();
    evaluations.forEach((e) => {
      const d = new Date(e.fecha);
      if (Number.isNaN(d.getTime())) return;
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      const cur = meses.get(k) ?? { suma: 0, n: 0, fecha: d };
      cur.suma += e.puntajeFinal;
      cur.n += 1;
      meses.set(k, cur);
    });
    return Array.from(meses.values())
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .slice(-6)
      .map((m) => {
        const prom = Math.round((m.suma / m.n) * 10) / 10;
        return {
          valor: prom,
          color: prom <= 2 ? RISK_CONFIG.Bajo.hex : prom <= 4 ? RISK_CONFIG.Medio.hex : prom <= 7 ? RISK_CONFIG.Alto.hex : RISK_CONFIG["Muy Alto"].hex,
          etiqueta: m.fecha.toLocaleDateString("es-CO", { month: "short", year: "2-digit" }),
        };
      });
  }, [evaluations, chartView]);
  const chartMax = Math.max(...chartData.map((d) => d.valor), 1);

  /* ── Filtros reales de evaluaciones ── */
  const riskOptions = useMemo(
    () => Array.from(new Set(evaluations.map((e) => e.nivelRiesgo).filter(Boolean))).sort(),
    [evaluations]
  );

  // Casos que necesitan seguimiento pronto: los más recientes en Alto/Muy
  // Alto. Sin esto, un admin solo se entera si revisa la tabla completa.
  const urgentCases = useMemo(
    () => evaluations
      .filter((e) => e.nivelRiesgo === "Alto" || e.nivelRiesgo === "Muy Alto")
      .slice(-5)
      .reverse(),
    [evaluations]
  );

  const filteredEvaluations = useMemo(() => {
    const q = evalQuery.trim().toLowerCase();
    const list = evaluations.filter((e) => {
      const matchQ = !q
        || (e.nombre || "").toLowerCase().includes(q)
        || (e.email || "").toLowerCase().includes(q)
        || (e.cedula || "").toLowerCase().includes(q);
      const matchRisk = evalRisk === "todos" || e.nivelRiesgo === evalRisk;
      return matchQ && matchRisk;
    });
    const dir = evalSort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => evalSort.key === "fecha"
      ? (new Date(a.fecha).getTime() - new Date(b.fecha).getTime()) * dir
      : (a.puntajeFinal - b.puntajeFinal) * dir);
  }, [evaluations, evalQuery, evalRisk, evalSort]);

  function toggleSort(key: SortKey) {
    setEvalSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
  }

  /* ── Filtros reales de usuarios ── */
  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchQ = !q
        || (u.nombre || "").toLowerCase().includes(q)
        || (u.email || "").toLowerCase().includes(q)
        || (u.cedula || "").toLowerCase().includes(q);
      const matchRole = userRole === "todos" || u.rol === userRole;
      return matchQ && matchRole;
    });
  }, [users, userQuery, userRole]);

  function exportEvaluacionesCSV() {
    downloadCSV(`rosa-evaluaciones-${Date.now()}.csv`, [
      ["Fecha", "Nombre", "Cédula", "Email", "Puntaje", "Nivel de riesgo", "Objetos detectados"],
      ...filteredEvaluations.map((e) => {
        const objetos = parseDetalles(e.detalles).objetos;
        const objetosTxt = Array.isArray(objetos) ? objetos.join(" | ") : (objetos || "");
        return [new Date(e.fecha).toLocaleDateString("es-CO"), e.nombre || "", e.cedula || "", e.email, e.puntajeFinal, e.nivelRiesgo, objetosTxt];
      }),
    ]);
  }

  function exportUsuariosCSV() {
    downloadCSV(`rosa-usuarios-${Date.now()}.csv`, [
      ["Nombre", "Cédula", "Email", "Rol", "Fecha registro"],
      ...filteredUsers.map((u) => [u.nombre, u.cedula, u.email, u.rol, u.fechaRegistro || ""]),
    ]);
  }

  const NAV_ITEMS: { icon: string; label: string; view: View }[] = [
    { icon: "dashboard",  label: "Resumen general", view: "resumen" },
    { icon: "bar_chart",  label: "Evaluaciones",    view: "evaluaciones" },
    { icon: "group",      label: "Usuarios",        view: "usuarios" },
    { icon: "analytics",  label: "Reportes",        view: "reportes" },
  ];

  const tableView: "evaluaciones" | "usuarios" = view === "usuarios" ? "usuarios" : "evaluaciones";

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm h-16 flex items-center">
        <div className="flex justify-between items-center w-full px-6 lg:px-10 max-w-[1280px] mx-auto">
          <span className="text-xl font-bold text-[#005224]">ROSA Expert</span>
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.slice(0, 3).map(({ label, view: v }) => (
              <button
                key={label}
                onClick={() => goTo(v)}
                className={`text-sm font-semibold transition-colors ${view === v ? "text-[#005224]" : "text-gray-500 hover:text-[#005224]"}`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
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
          {/* Solo "Reportes": Resumen/Evaluaciones/Usuarios ya están en el
              nav superior (ref NAV_ITEMS.slice(0,3)) y, en pantallas donde
              ambos son visibles a la vez (lg+), tenerlos duplicados aquí
              confundía más de lo que ayudaba. */}
          <nav className="flex flex-col gap-1 flex-1">
            {NAV_ITEMS.filter(({ view: v }) => v === "reportes").map(({ icon, label, view: v }) => (
              <button key={label} onClick={() => goTo(v)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer font-semibold text-sm transition text-left
                  ${view === v ? "bg-[#006D32] text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}>
                <span className="material-symbols-outlined text-lg">{icon}</span>
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto p-3">
            <button
              onClick={() => navigate("/")}
              className="w-full py-2.5 px-4 bg-[#FF6B00] text-white rounded-xl font-semibold text-sm hover:bg-[#E05A00] transition flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-base">add</span>
              Nueva evaluación
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main id="panel-content" className="flex-1 lg:ml-72 p-6 lg:p-10 space-y-8 max-w-[1280px] mx-auto w-full">

          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0b1c30]">Panel Ergonómico</h1>
              <p className="text-gray-500 mt-1">Monitoreo en tiempo real de evaluaciones ROSA — Seguros Bolívar</p>
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-full text-sm">
              <button
                onClick={() => setChartView("mensual")}
                className={`px-4 py-1.5 rounded-full font-semibold transition ${chartView === "mensual" ? "bg-[#006D32] text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                Vista mensual
              </button>
              <button
                onClick={() => setChartView("trimestral")}
                className={`px-4 py-1.5 rounded-full font-semibold transition ${chartView === "trimestral" ? "bg-[#006D32] text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                Vista trimestral
              </button>
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
                    <div className="text-[64px] font-black leading-none" style={{ color: lastEval ? riskCfg(lastEval.nivelRiesgo).hex : "#9CA3AF" }}>
                      {lastEval?.puntajeFinal ?? "—"}
                    </div>
                    <div className={`inline-flex items-center gap-1 mt-3 px-4 py-1.5 rounded-full border text-sm font-bold ${lastEval ? riskCfg(lastEval.nivelRiesgo).badge : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {lastEval?.nivelRiesgo ?? "Sin datos"}
                    </div>
                  </>
                )}
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {lastEval
                    ? `Última evaluación registrada: ${new Date(lastEval.fecha).toLocaleDateString("es-CO")}`
                    : "Sin evaluaciones aún"}
                </p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="md:col-span-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {chartView === "mensual" ? "Historial de puntajes" : "Promedio mensual (últimos meses)"}
                </span>
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
                  <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="w-full border-b border-gray-100" />
                    ))}
                  </div>
                  {chartData.map((d, i) => {
                    const pct = d.valor / chartMax;
                    const isLast = i === chartData.length - 1;
                    return (
                      <div key={i} className="relative flex-1 flex flex-col justify-end h-full group">
                        <div
                          className="w-full rounded-t-lg transition-all duration-500 relative"
                          style={{ height: `${Math.max(pct * 100, 8)}%`, backgroundColor: d.color, opacity: isLast ? 1 : 0.4, border: isLast ? `2px solid ${d.color}` : "none" }}
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            {d.valor}
                          </div>
                        </div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap">
                          {d.etiqueta}
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
                { icon: "group",         label: "Usuarios",             value: loading ? "…" : users.length,        color: "#005224" },
                { icon: "assignment",    label: "Evaluaciones totales", value: loading ? "…" : evaluations.length,  color: "#005224" },
                { icon: "trending_up",   label: "Puntaje promedio",     value: loading ? "…" : avgScore.toFixed(1), color: "#ea580c" },
                { icon: "warning",       label: "Riesgo alto o mayor",  value: loading ? "…" : highRisk,            color: "#dc2626" },
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

          {/* ── Casos que necesitan atención ── */}
          {urgentCases.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-red-600">warning</span>
                <h3 className="font-bold text-red-800 text-sm">Casos que necesitan atención pronto</h3>
                <span className="ml-auto text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
                  {evaluations.filter((e) => e.nivelRiesgo === "Alto" || e.nivelRiesgo === "Muy Alto").length}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {urgentCases.map((ev, i) => {
                  const cfg = riskCfg(ev.nivelRiesgo);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedEval(ev)}
                      className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 text-left hover:bg-red-50/60 transition border border-red-100"
                    >
                      <span className="text-sm font-black shrink-0 w-6" style={{ color: cfg.hex }}>{ev.puntajeFinal}</span>
                      <span className="text-sm font-semibold text-gray-800 truncate flex-1">{ev.nombre || ev.email}</span>
                      <span className="text-xs text-gray-400 shrink-0">{new Date(ev.fecha).toLocaleDateString("es-CO")}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>{ev.nivelRiesgo}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Contenido según sección ── */}
          {/* El selector de abajo es la única forma de llegar a "Reportes" en
              pantallas donde el sidebar (lg:flex) o el nav superior (md:flex)
              están ocultos por el layout responsive — por eso vive fuera del
              condicional y siempre está visible. */}
          <section>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
              <h3 className="text-xl font-bold text-[#0b1c30]">
                {view === "reportes" ? "Reportes" : "Datos del sistema"}
              </h3>
              <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 text-sm">
                {([
                  { v: "evaluaciones" as View, label: "Evaluaciones" },
                  { v: "usuarios" as View, label: "Usuarios" },
                  { v: "reportes" as View, label: "Reportes" },
                ]).map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => goTo(v)}
                    className={`px-4 py-1.5 rounded-lg font-semibold transition
                      ${(view === v || (view === "resumen" && v === "evaluaciones")) ? "bg-[#006D32] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {view === "reportes" ? (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF7F2] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#005224]">assignment</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">Evaluaciones</p>
                      <p className="text-xs text-gray-400">{filteredEvaluations.length} de {evaluations.length} registros (según el filtro activo)</p>
                    </div>
                  </div>
                  <button onClick={exportEvaluacionesCSV}
                    className="self-start flex items-center gap-2 px-4 py-2 bg-[#006D32] text-white rounded-xl font-semibold text-sm hover:bg-[#005224] transition">
                    <span className="material-symbols-outlined text-base">download</span>
                    Exportar CSV
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF7F2] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#005224]">group</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">Usuarios</p>
                      <p className="text-xs text-gray-400">{filteredUsers.length} de {users.length} registros (según el filtro activo)</p>
                    </div>
                  </div>
                  <button onClick={exportUsuariosCSV}
                    className="self-start flex items-center gap-2 px-4 py-2 bg-[#006D32] text-white rounded-xl font-semibold text-sm hover:bg-[#005224] transition">
                    <span className="material-symbols-outlined text-base">download</span>
                    Exportar CSV
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Los reportes exportan lo que esté visible según los filtros de las pestañas "Evaluaciones" y "Usuarios" — ajusta esos filtros antes de exportar si necesitas un subconjunto.
              </p>
              </>
            ) : (
              <>
              {/* ── Filtros reales ── */}
              {tableView === "evaluaciones" ? (
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                    <input
                      value={evalQuery}
                      onChange={(e) => setEvalQuery(e.target.value)}
                      placeholder="Buscar por nombre, correo o cédula..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#006D32]/30 focus:border-[#006D32]"
                    />
                  </div>
                  <select
                    value={evalRisk}
                    onChange={(e) => setEvalRisk(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#006D32]/30"
                  >
                    <option value="todos">Todos los niveles</option>
                    {riskOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                    <input
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="Buscar por nombre, correo o cédula..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#006D32]/30 focus:border-[#006D32]"
                    />
                  </div>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#006D32]/30"
                  >
                    <option value="todos">Todos los roles</option>
                    <option value="user">Colaborador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                  <div className="p-12 text-center">
                    <LoadingSpinner size={72} label="Cargando datos..." />
                  </div>
                ) : tableView === "evaluaciones" ? (
                  filteredEvaluations.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 text-sm">
                      {evaluations.length === 0 ? "No hay evaluaciones registradas aún." : "Ningún resultado coincide con el filtro."}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#eff4ff] border-b border-gray-200">
                            <th onClick={() => toggleSort("fecha")} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-[#005224]">
                              Fecha {evalSort.key === "fecha" && (evalSort.dir === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre</th>
                            <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Cédula</th>
                            <th onClick={() => toggleSort("puntajeFinal")} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-[#005224]">
                              Puntaje {evalSort.key === "puntajeFinal" && (evalSort.dir === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Nivel de riesgo</th>
                            <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Objetos detectados</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredEvaluations.map((ev, i) => {
                            const cfg = riskCfg(ev.nivelRiesgo);
                            const objetos = parseDetalles(ev.detalles).objetos;
                            const objetosTxt = Array.isArray(objetos) ? objetos.join(", ") : (objetos || "");
                            return (
                              <tr key={i} onClick={() => setSelectedEval(ev)}
                                className="hover:bg-[#f8f9ff] transition cursor-pointer">
                                <td className="px-5 py-4 text-sm text-gray-500">
                                  {new Date(ev.fecha).toLocaleDateString("es-CO")}
                                </td>
                                <td className="px-5 py-4 font-semibold text-sm text-gray-900">{ev.nombre || "—"}</td>
                                <td className="px-5 py-4 text-sm text-gray-500">{ev.cedula || "—"}</td>
                                <td className="px-5 py-4">
                                  <span className="text-lg font-black" style={{ color: cfg.hex }}>{ev.puntajeFinal}</span>
                                </td>
                                <td className="px-5 py-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                    {ev.nivelRiesgo}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-xs text-gray-400 max-w-[220px] truncate" title={objetosTxt || undefined}>{objetosTxt || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 text-sm">
                      {users.length === 0 ? "No hay usuarios registrados aún." : "Ningún resultado coincide con el filtro."}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#eff4ff] border-b border-gray-200">
                            {["Nombre", "Cédula", "Email", "Rol", "Fecha registro"].map((h) => (
                              <th key={h} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredUsers.map((u, i) => (
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
              </>
            )}
          </section>

          {/* ── Hero section ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[#006D32] text-white rounded-3xl overflow-hidden shadow-lg p-8 lg:p-10">
            <div className="space-y-5">
              <h2 className="text-2xl font-black leading-tight">Evaluación Clínica<br />de Precisión</h2>
              <p className="text-white/80 text-sm leading-relaxed">
                La metodología ROSA permite identificar estresores ergonómicos específicos antes de que se conviertan en trastornos musculoesqueléticos crónicos. El monitoreo continuo es el primer paso hacia la salud física a largo plazo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/")}
                  className="px-5 py-2.5 bg-[#9bf7ac] text-[#00210b] font-bold rounded-xl text-sm hover:scale-105 transition-transform">
                  Nueva evaluación
                </button>
                <button
                  onClick={() => goTo("evaluaciones")}
                  className="px-5 py-2.5 border border-white/40 text-white font-bold rounded-xl text-sm hover:bg-white/10 transition">
                  Ver evaluaciones
                </button>
              </div>
            </div>
            <div className="relative h-56 md:h-64 rounded-2xl overflow-hidden shadow-2xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/30 text-[120px]">clinical_notes</span>
            </div>
          </section>

        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="w-full bg-[#dce9ff] border-t border-gray-200 lg:ml-0">
        <div className="max-w-[1280px] mx-auto py-10 px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="text-lg font-bold text-[#005224] mb-1">ROSA Expert</div>
            <p className="text-sm text-gray-500">© 2026 Sistema Ergonómico ROSA — Seguros Bolívar</p>
          </div>
        </div>
      </footer>

      {/* ── Detalle de evaluación ── */}
      {selectedEval && (() => {
        const cfg = riskCfg(selectedEval.nivelRiesgo);
        const det = parseDetalles(selectedEval.detalles);
        const objetos = Array.isArray(det.objetos) ? det.objetos : (det.objetos ? [det.objetos] : []);
        const recs = (selectedEval.recomendaciones || "")
          .split("|").map((r) => r.trim()).filter(Boolean);
        return (
          <div
            className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
            onClick={() => setSelectedEval(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-lg text-gray-900">{selectedEval.nombre || selectedEval.email}</p>
                  <p className="text-sm text-gray-400">
                    {selectedEval.cedula ? `Cédula ${selectedEval.cedula} · ` : ""}
                    {new Date(selectedEval.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => setSelectedEval(null)} className="text-gray-400 hover:text-gray-600 transition shrink-0">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black" style={{ color: cfg.hex }}>{selectedEval.puntajeFinal}</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    Riesgo {selectedEval.nivelRiesgo}
                  </span>
                </div>

                {(det.silla || det.pantalla || det.teclado) && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Silla", value: det.silla },
                      { label: "Pantalla", value: det.pantalla },
                      { label: "Teclado/mouse", value: det.teclado },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-black text-gray-800">{value ?? "—"}</p>
                        <p className="text-[11px] text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {objetos.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Objetos detectados</p>
                    <div className="flex flex-wrap gap-2">
                      {objetos.map((o, i) => (
                        <span key={i} className="text-xs font-semibold bg-[#EEF7F2] text-[#005224] px-2.5 py-1 rounded-full">{o}</span>
                      ))}
                    </div>
                  </div>
                )}

                {recs.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Recomendaciones</p>
                    <ul className="space-y-2">
                      {recs.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-5 h-5 rounded-full bg-orange-50 text-[#FF6B00] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedEval.urlImagen && (
                  <a href={selectedEval.urlImagen} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#006D32] hover:text-[#005224]">
                    <span className="material-symbols-outlined text-base">image</span>
                    Ver foto en Drive
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
