import { useState } from 'react';

type AuthImageProps = {
  src: string;
  fallbackSrc: string;
  className: string;
};

export function AuthImage({ className, fallbackSrc, src }: AuthImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
      src={currentSrc}
    />
  );
}
