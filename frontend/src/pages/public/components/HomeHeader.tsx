import { PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#063c36]/94 text-white shadow-[0_12px_34px_rgba(6,60,54,0.18)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link className="flex items-center gap-3" to="/">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#d6a84f] text-[#063c36] shadow-[0_10px_30px_rgba(214,168,79,0.22)]">
            <PiggyBank size={24} />
          </span>

          <div>
            <p className="text-lg font-black leading-none">Qori</p>
            <p className="text-xs font-semibold text-[#a9ded4]">
              Finanzas claras, sin estrés
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#dff5ef] md:flex">
          <a className="hover:text-[#d6a84f]" href="#demo">
            Demo
          </a>
          <a className="hover:text-[#d6a84f]" href="#funciones">
            Funciones
          </a>
          <a className="hover:text-[#d6a84f]" href="#coach">
            Coach IA
          </a>
          <a className="hover:text-[#d6a84f]" href="#confianza">
            Confianza
          </a>
          <a className="hover:text-[#d6a84f]" href="#contacto">
            Contacto
          </a>
        </nav>

        <Link
          className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-[#063c36]"
          to="/login"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}
