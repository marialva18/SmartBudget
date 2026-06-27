import { PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link className="flex items-center gap-3" to="/">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-800 text-white shadow-lg shadow-emerald-900/20">
            <PiggyBank size={24} />
          </span>

          <div>
            <p className="text-lg font-black leading-none">SmartBudget</p>
            <p className="text-xs font-semibold text-emerald-700">
              Finanzas claras, sin estrés
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
          <a className="hover:text-emerald-800" href="#funciones">
            Funciones
          </a>
          <a className="hover:text-emerald-800" href="#coach">
            Coach IA
          </a>
          <a className="hover:text-emerald-800" href="#confianza">
            Confianza
          </a>
          <a className="hover:text-emerald-800" href="#contacto">
            Contacto
          </a>
        </nav>

        <Link
          className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
          to="/login"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}