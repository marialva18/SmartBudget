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
      <span className="px-1 text-xs font-semibold uppercase tracking-wide text-[#3c4a46]">
        {label}
      </span>
      <input
        className="mt-1 h-12 w-full rounded-lg border-2 border-transparent bg-[#f2f4f6] px-4 text-[#191c1e] outline-none transition focus:border-[#006b5f] focus:bg-white"
        {...registration}
        {...inputProps}
      />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}
