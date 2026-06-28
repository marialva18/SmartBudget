import type { ReactNode } from 'react';

type AuthCardProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <section
      className={[
        'rounded-xl border border-[#dde8e4] bg-white/95 p-6 shadow-[0_18px_45px_rgba(9,60,54,0.08)] backdrop-blur md:p-8',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  );
}
