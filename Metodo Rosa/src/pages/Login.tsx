import { useState } from "react";
import { useAuth } from "../context/AuthContext";

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
    <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center p-4">

      <div className="w-full max-w-md">

        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#005224] mb-4">
            <span className="text-white text-2xl font-bold">R</span>
          </div>
          <h1 className="text-3xl font-bold text-[#005224]">ROSA Expert</h1>
          <p className="text-gray-500 mt-1">Evaluación ergonómica de puestos de trabajo</p>
        </div>

        {/* Tarjeta */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">

          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número de cédula
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                value={cedula}
                onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
                placeholder="Ej: 1023456789"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#006D32]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correo corporativo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@segurosbolivar.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#006D32]"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#FF6B00] py-3 font-semibold text-white hover:bg-[#E05A00] transition disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Ingresar"}
            </button>

          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Acceso restringido a usuarios autorizados por Seguros Bolívar
          </p>

          <p className="text-xs text-gray-400 text-center mt-3">
            Las fotografías se analizan localmente en tu dispositivo.
            No se envían a servidores externos.
          </p>

        </div>

      </div>

    </div>
  );
}
