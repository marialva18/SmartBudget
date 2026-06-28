import { QoriMark } from '../../../components/brand/QoriMark';

export function AuthBrand() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4">
        <QoriMark size="md" />
      </div>
      <p className="text-xl font-black text-[#063c36]">Qori</p>
      <p className="mt-1 text-sm font-semibold text-[#52625d]">
        Finanzas claras, paso a paso.
      </p>
    </div>
  );
}
