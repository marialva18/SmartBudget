import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { es } from '../i18n/es';

export function RouteErrorPage() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f8f7] px-5 py-10 text-slate-950">
      <section className="w-full max-w-xl rounded-lg bg-white p-6 text-center shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
        <span className="mx-auto grid size-12 place-items-center rounded-md bg-red-50 text-red-700">
          <AlertTriangle size={24} />
        </span>
        <p className="mt-5 text-sm font-semibold uppercase text-emerald-700">
          {isNotFound ? es.routeErrors.notFoundCode : es.routeErrors.errorCode}
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {isNotFound ? es.routeErrors.notFoundTitle : es.routeErrors.errorTitle}
        </h1>
        <p className="mt-3 text-slate-600">
          {isNotFound
            ? es.routeErrors.notFoundDescription
            : es.routeErrors.errorDescription}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white"
            to="/app/dashboard"
          >
            <Home size={18} />
            {es.routeErrors.goDashboard}
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-800 px-5 py-3 font-semibold text-emerald-900"
            to="/login"
          >
            <ArrowLeft size={18} />
            {es.routeErrors.goLogin}
          </Link>
        </div>
      </section>
    </main>
  );
}
