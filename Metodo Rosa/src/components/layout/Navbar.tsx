import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toggle } = useSidebar();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-50">

      <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between px-8">

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="lg:hidden p-2 rounded-lg text-[#005224] hover:bg-green-50"
            aria-label="Menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="text-2xl font-bold text-[#005224]">
            ROSA Expert
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-10">
          <a href="#" className="text-[#006D32] border-b-2 border-[#006D32] pb-1 font-semibold">
            Evaluación
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-[#005224] transition" title="Notificaciones">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-[#005224] transition" title="Ayuda">
            <span className="material-symbols-outlined">help_outline</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 ml-2">
              <span className="material-symbols-outlined text-[#006D32]">account_circle</span>
              <span className="text-sm text-gray-600 font-medium hidden md:block">
                {user.nombre || user.email}
              </span>
              <button
                onClick={logout}
                className="ml-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Salir
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
