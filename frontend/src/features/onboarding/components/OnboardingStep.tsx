import type { ReactNode } from 'react';

type OnboardingStepProps = {
  children: ReactNode;
  current: number;
  description: string;
  title: string;
};

export function OnboardingStep({
  children,
  current,
  description,
  title,
}: OnboardingStepProps) {
  const percentage = current * 25;
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col justify-center px-5 py-10 md:px-8">
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs font-semibold uppercase text-slate-500">
          <span>Paso {current} de 4</span>
          <span>{percentage}% completado</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-700 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">{description}</p>
      </div>
      {children}
    </main>
  );
}
