import type { ReactNode } from 'react';

type AuthCardProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <section
      className={[
        'rounded-xl border border-[#e0e3e5] bg-white p-6 shadow-[0_10px_30px_rgba(13,148,136,0.08)] md:p-10',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  );
}
