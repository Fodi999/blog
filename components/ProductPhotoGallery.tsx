'use client';

import { useState } from 'react';

type ProductPhotoGalleryProps = {
  images: string[];
  name: string;
  fallbackLabel: string;
};

export function ProductPhotoGallery({ images, name, fallbackLabel }: ProductPhotoGalleryProps) {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  function openImage(url: string) {
    setActiveImage(url);
    setZoom(1);
  }

  function closeImage() {
    setActiveImage(null);
    setZoom(1);
  }

  if (!images.length) {
    return (
      <div className="product-page__gallery">
        <div className="media"><span>{fallbackLabel}</span></div>
      </div>
    );
  }

  return (
    <>
      <div className="product-page__gallery">
        {images.map((url, index) => (
          <button className="product-photo-button" type="button" onClick={() => openImage(url)} key={`${url}-${index}`}>
            <img src={url} alt={name} />
            <span>View high resolution</span>
          </button>
        ))}
      </div>
      {activeImage ? (
        <div className="product-photo-lightbox" role="dialog" aria-modal="true" aria-label="Product photo preview" onClick={closeImage}>
          <div className="product-photo-lightbox__bar" onClick={(event) => event.stopPropagation()}>
            <strong>DIMA FOMIN</strong>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((current) => Math.max(.5, current - .25))}>-</button>
            <button type="button" onClick={() => setZoom(1)}>100%</button>
            <button type="button" onClick={() => setZoom((current) => Math.min(3, current + .25))}>+</button>
            <button type="button" onClick={closeImage}>Close</button>
          </div>
          <div className="product-photo-lightbox__stage" onClick={(event) => event.stopPropagation()}>
            <img src={activeImage} alt={`${name} high resolution`} style={{ transform: `scale(${zoom})` }} />
            <span className="product-photo-lightbox__mark">DIMA FOMIN</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
