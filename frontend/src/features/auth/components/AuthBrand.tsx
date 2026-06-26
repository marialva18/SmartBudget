import { WalletCards } from 'lucide-react';

export function AuthBrand() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 rounded-xl bg-[#2dd4bf] p-3 text-[#00574d]">
        <WalletCards className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="font-semibold text-[#006b5f]">Smart Budget</p>
    </div>
  );
}
