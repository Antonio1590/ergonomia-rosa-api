import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { SeatedPostureArt } from "../components/illustrations/ErgonomicArt";

const TRUST_POINTS = [
  { icon: "lock", label: "Análisis local" },
  { icon: "privacy_tip", label: "Uso confidencial" },
  { icon: "verified_user", label: "Acceso controlado" },
];

export default function Login() {
  const { login } = useAuth();

  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un correo válido");
      return;
    }

    if (!/^\d{6,12}$/.test(cedula)) {
      setError("La cédula debe tener entre 6 y 12 dígitos");
      return;
    }

    setLoading(true);
    try {
      await login(email, cedula);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar sesión. Verifica tus datos."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center p-4 lg:p-8">
      <div className="relative w-full max-w-[1080px] rounded-[32px] overflow-hidden shadow-2xl">

        {/* ── Fondo: degradado + formas orgánicas difuminadas (sin fotos externas) ── */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00301A] via-[#00431F] to-[#005B29]" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-[#9bf7ac] opacity-20 blur-[90px]" />
          <div className="absolute top-1/3 -right-10 w-96 h-96 rounded-full bg-[#16A34A] opacity-25 blur-[110px]" />
          <div className="absolute -bottom-32 left-1/4 w-[28rem] h-[28rem] rounded-full bg-[#003D1A] opacity-60 blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-[#9bf7ac] opacity-10 blur-[80px]" />
          <SeatedPostureArt
            className="absolute right-[-40px] bottom-[-30px] w-[380px] h-auto opacity-[0.08]"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>

        {/* ── Contenido ── */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">

          {/* Columna izquierda: marca + confianza */}
          <div className="flex flex-col justify-between p-8 lg:p-12">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                <span className="text-white text-xl font-bold">R</span>
              </div>
              <span className="text-white font-bold text-lg">ROSA Expert</span>
            </div>

            <div className="my-10 lg:my-0">
              <h1 className="text-4xl lg:text-[52px] font-black text-white leading-[1.05] tracking-tight">
                Bienvenido<br />de nuevo
              </h1>
              <p className="mt-4 text-white/60 text-sm lg:text-base max-w-xs">
                Evaluación ergonómica con IA, pensada para ayudarte.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {TRUST_POINTS.map(({ icon, label }) => (
                <div key={label} className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/15 hover:bg-white/15 transition">
                  <span className="material-symbols-outlined text-[#9bf7ac] text-lg">{icon}</span>
                  <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#00210b] px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 group-hover:opacity-100 transition">
                    {label}
                  </span>
                </div>
              ))}
              <p className="text-[11px] text-white/45 leading-snug max-w-[150px]">
                Fotos y resultados de uso confidencial, dentro de un entorno controlado.
              </p>
            </div>
          </div>

          {/* Columna derecha: formulario */}
          <div className="flex items-center justify-center p-8 lg:p-14 lg:pl-8">
            <div className="w-full max-w-sm">

              <div className="flex items-center gap-4 mb-8">
                <span className="h-px flex-1 bg-white/20" />
                <h2 className="text-white font-bold text-sm tracking-[0.2em] uppercase">Iniciar sesión</h2>
                <span className="h-px flex-1 bg-white/20" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-7">

                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                    Número de cédula
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ej: 1023456789"
                    className="w-full appearance-none bg-transparent border-0 border-b border-white/25 rounded-none pb-2.5 text-white placeholder-white/35 outline-none focus:outline-none focus:ring-0 focus:border-[#9bf7ac] transition-colors"
                    style={{ boxShadow: "none" }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                    Correo corporativo
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@segurosbolivar.com"
                    className="w-full appearance-none bg-transparent border-0 border-b border-white/25 rounded-none pb-2.5 text-white placeholder-white/35 outline-none focus:outline-none focus:ring-0 focus:border-[#9bf7ac] transition-colors"
                    style={{ boxShadow: "none" }}
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-400/30 p-3">
                    <p className="text-sm text-red-200 font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#FF6B00] py-3.5 font-semibold text-white hover:bg-[#E05A00] hover:scale-[1.01] transition disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-black/20"
                >
                  {loading ? "Verificando..." : "Ingresar"}
                </button>

              </form>

              <p className="mt-8 text-center text-xs text-white/35">
                Acceso restringido a usuarios autorizados por Seguros Bolívar
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
