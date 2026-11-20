import React, { useEffect, useState } from 'react';
import { ProductId } from '../../products';
import { cachedThumbnail, productThumbnail } from '../../three/thumbnails';

interface Props {
  product: ProductId;
  preset?: string;
  size?: number;
  fallbackIcon: string; // path SVG 60×40, tampil selama gambar 3D belum jadi / WebGL tidak ada
  alt: string;
}

/** Gambar asli template dari model 3D-nya; ikon garis sebagai cadangan */
export const ProductThumb: React.FC<Props> = ({ product, preset, size = 0, fallbackIcon, alt }) => {
  const [src, setSrc] = useState<string | null>(() => cachedThumbnail(product, preset, size));
  useEffect(() => {
    let alive = true;
    setSrc(cachedThumbnail(product, preset, size));
    productThumbnail(product, preset, size).then((u) => alive && u && setSrc(u));
    return () => {
      alive = false;
    };
  }, [product, preset, size]);

  if (src) return <img src={src} alt={alt} className="w-full h-full object-contain" draggable={false} />;
  return (
    <svg viewBox="0 0 60 40" className="w-full h-full p-2 text-stone-400 animate-pulse" aria-hidden="true">
      <path d={fallbackIcon} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
