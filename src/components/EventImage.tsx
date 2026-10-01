import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface EventImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
}

function isSafeImageUrl(value: string): boolean {
  try {
    const url = new URL(value, 'https://eventlink.invalid');
    return url.protocol === 'https:' ||
      (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch {
    return false;
  }
}

export function EventImage({ src, alt, style }: EventImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const safeSrc = isSafeImageUrl(src) ? src : null;
  const isFailed = !safeSrc || failedSrc === src;
  const isLoaded = safeSrc !== null && loadedSrc === src;

  return (
    <div className="event-image-frame" style={style}>
      {!isLoaded && (
        <div
          className="event-image-placeholder"
          role={isFailed ? 'img' : undefined}
          aria-label={isFailed ? `${alt}: image unavailable` : undefined}
          aria-hidden={!isFailed}
        >
          <ImageOff size={22} aria-hidden="true" />
          {isFailed && <span>Image unavailable</span>}
        </div>
      )}
      {safeSrc && !isFailed && (
        <img
          src={safeSrc}
          alt={alt}
          loading="lazy"
          className="event-image-media"
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
        />
      )}
    </div>
  );
}