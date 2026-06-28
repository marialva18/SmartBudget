type QoriMarkProps = {
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'size-12',
  md: 'size-16',
  lg: 'size-20',
};

const iconSizeClasses = {
  sm: 'h-10 w-10 scale-[1.25]',
  md: 'h-14 w-14 scale-[1.35]',
  lg: 'h-16 w-16 scale-[1.45]',
};

export function QoriMark({ size = 'md' }: QoriMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        'qori-mark relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#e5f5ef] font-black text-[#005f55] shadow-[0_16px_40px_rgba(9,60,54,0.12)]',
        sizeClasses[size],
      ].join(' ')}
    >
      <img
        alt=""
        aria-hidden="true"
        className={`${iconSizeClasses[size]} object-contain`}
        src="/images/qori_icon.png"
      />

      <span className="qori-mark-coin" />
    </span>
  );
}