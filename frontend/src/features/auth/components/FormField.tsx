import type { InputHTMLAttributes } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
};

export function FormField({
  label,
  error,
  registration,
  ...inputProps
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="px-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#52625d]">
        {label}
      </span>
      <input
        className="mt-1 h-12 w-full rounded-lg border border-[#dfe8e4] bg-[#f7faf8] px-4 text-[#191c1e] outline-none transition placeholder:text-[#6b7a76]/70 hover:border-[#bacac5] focus:border-[#006b5f] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,107,95,0.12)]"
        {...registration}
        {...inputProps}
      />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}
