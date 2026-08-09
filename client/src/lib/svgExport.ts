/**
 * Shared SVG → PNG / JSON download helpers for canvas modules.
 */

export function slugify(name: string, fallback = 'export'): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return s || fallback;
}

export function downloadUrl(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export function downloadJson(
  data: unknown,
  filenameBase: string,
  fallback = 'export'
): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, `${slugify(filenameBase, fallback)}.json`);
  URL.revokeObjectURL(url);
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to rasterize SVG'));
    img.src = url;
  });
}

export interface ExportSvgAsPngOptions {
  svg: SVGSVGElement;
  filenameBase: string;
  fallbackName?: string;
  /** Pixel size; defaults from viewBox or width/height attributes. */
  width?: number;
  height?: number;
  /** Canvas fill before draw; omit or null for transparent. */
  background?: string | null;
  /** Mutate the clone before serialize (e.g. inline external images). */
  prepareClone?: (clone: SVGSVGElement) => void | Promise<void>;
}

/**
 * Clone an SVG element, optionally prepare it, rasterize to PNG, and download.
 */
export async function exportSvgAsPng(
  options: ExportSvgAsPngOptions
): Promise<void> {
  const {
    svg,
    filenameBase,
    fallbackName = 'export',
    background = '#0c0a12',
    prepareClone,
  } = options;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const vb = clone.getAttribute('viewBox')?.split(/\s+/).map(Number);
  const vbW = vb && vb.length >= 4 ? vb[2] : 0;
  const vbH = vb && vb.length >= 4 ? vb[3] : 0;
  const attrW = Number(clone.getAttribute('width'));
  const attrH = Number(clone.getAttribute('height'));
  const width = options.width ?? (attrW || vbW || 800);
  const height = options.height ?? (attrH || vbH || 800);

  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  if (prepareClone) {
    await prepareClone(clone);
  }

  const xml = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);
    downloadUrl(
      canvas.toDataURL('image/png'),
      `${slugify(filenameBase, fallbackName)}.png`
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
