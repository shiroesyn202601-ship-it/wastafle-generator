import React, { useEffect, useRef, useState } from 'react';
import { ProductId } from '../../products';
import { cachedThumbnail, productThumbnail } from '../../three/thumbnails';

interface Props {
  product: ProductId;
  preset?: string;
  size?: number;
  fallbackIcon: string; // path SVG 60×40, tampil selama gambar 3D belum jadi / WebGL tidak ada
  alt: string;
}

/**
 * Gambar asli template dari model 3D-nya; ikon garis sebagai cadangan.
 * Gambar baru dibuat saat kartu terlihat di layar (desain ada ribuan), dan antrean yang sudah
 * tidak terlihat lagi dilewati.
 */
export const ProductThumb: React.FC<Props> = ({ product, preset, size = 0, fallbackIcon, alt }) => {
  const [src, setSrc] = useState<string | null>(() => cachedThumbnail(product, preset, size));
  const [visible, setVisible] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const seen = useRef(false);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const on = entries.some((e) => e.isIntersecting);
        seen.current = on;
        setVisible(on);
      },
      { rootMargin: '300px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    const hit = cachedThumbnail(product, preset, size);
    setSrc(hit);
    if (hit || !visible) return;
    productThumbnail(product, preset, size, () => alive && seen.current).then((u) => alive && u && setSrc(u));
    return () => {
      alive = false;
    };
  }, [product, preset, size, visible]);

  return (
    <div ref={box} className="w-full h-full">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-contain" draggable={false} />
      ) : (
        <svg viewBox="0 0 60 40" className="w-full h-full p-2 text-stone-400 animate-pulse" aria-hidden="true">
          <path d={fallbackIcon} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
};
