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

function guessImageMime(href: string, contentType: string | null): string {
  const header = contentType?.split(';')[0]?.trim();
  if (header && header.startsWith('image/')) return header;
  const path = href.split('?')[0]?.toLowerCase() ?? '';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Inline external SVG `<image>` hrefs as data URLs (PNG or SVG) so PNG export
 * rasterizes same-origin after clone.
 */
export async function inlineExternalImages(
  svg: SVGSVGElement
): Promise<void> {
  const images = Array.from(svg.querySelectorAll('image'));
  await Promise.all(
    images.map(async (el) => {
      const href =
        el.getAttribute('href') ||
        el.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      if (!href || href.startsWith('data:')) return;
      try {
        const res = await fetch(href);
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        const mime = guessImageMime(href, res.headers.get('content-type'));
        const dataUrl = `data:${mime};base64,${arrayBufferToBase64(buf)}`;
        el.setAttribute('href', dataUrl);
        el.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
      } catch {
        /* leave href; image may omit from export */
      }
    })
  );
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
