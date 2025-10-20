import React, { useState } from 'react';

interface LogoProps {
  size?: number; // square size in pixels
  className?: string;
}

// Tries to load `/logo.png` first; falls back to Vite logo if missing.
export default function Logo({ size = 28, className = '' }: LogoProps) {
  const [src, setSrc] = useState<string>('/logo.png');
  const style = {
    width: `${size}px`,
    height: `${size}px`,
  } as React.CSSProperties;

  return (
    <img
      src={src}
      style={style}
      className={`rounded-md ${className}`}
      alt="App logo"
      onError={() => setSrc('/logo.png')}
      loading="eager"
    />
  );
}