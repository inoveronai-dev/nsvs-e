/** Smaller Unsplash thumbs so gallery navigation stays snappy. */
export const DEMO_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=400&q=60",
] as const;

function isTinyPlaceholder(dataUrl: string | undefined) {
  if (!dataUrl) return true;
  if (dataUrl.length < 250) return true;
  // 1×1 PNG used in early seed mocks
  if (dataUrl.includes("AAAABCAYAAAAfFcSJ")) return true;
  return false;
}

export function resolveMediaSrc(
  dataUrl: string | undefined,
  index: number,
  fallbackSeed: string,
): string {
  if (!isTinyPlaceholder(dataUrl) && dataUrl) {
    return dataUrl;
  }
  let hash = 0;
  for (let i = 0; i < fallbackSeed.length; i++) {
    hash =
      (hash + fallbackSeed.charCodeAt(i) * (i + 1)) %
      DEMO_GALLERY_IMAGES.length;
  }
  return DEMO_GALLERY_IMAGES[(hash + index) % DEMO_GALLERY_IMAGES.length];
}
