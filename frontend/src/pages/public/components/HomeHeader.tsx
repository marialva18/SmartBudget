import { PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e0e3e5] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link className="flex items-center gap-3" to="/">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#006b5f] text-white shadow-[0_10px_30px_rgba(13,148,136,0.14)]">
            <PiggyBank size={24} />
          </span>

          <div>
            <p className="text-lg font-black leading-none">Qori</p>
            <p className="text-xs font-semibold text-[#006b5f]">
              Finanzas claras, sin estres
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#3c4a46] md:flex">
          <a className="hover:text-[#006b5f]" href="#demo">
            Demo
          </a>
          <a className="hover:text-[#006b5f]" href="#funciones">
            Funciones
          </a>
          <a className="hover:text-[#006b5f]" href="#coach">
            Coach IA
          </a>
          <a className="hover:text-[#006b5f]" href="#confianza">
            Confianza
          </a>
          <a className="hover:text-[#006b5f]" href="#contacto">
            Contacto
          </a>
        </nav>

        <Link
          className="rounded-lg border border-[#bacac5] bg-white px-4 py-2 text-sm font-bold text-[#006b5f] transition hover:bg-[#f2f4f6]"
          to="/login"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}
