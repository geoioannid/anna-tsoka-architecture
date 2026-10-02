import path from 'node:path';
import sharp from 'sharp';

const cache = new Map<string, { width: number; height: number }>();

/**
 * Reads pixel dimensions of a file under public/ (e.g. '/uploads/x.webp')
 * at build time, so portrait/landscape decisions never touch the client.
 * Throws on unreadable images — a missing file must fail the build loudly,
 * not silently degrade the pair layout.
 */
export async function imageSize(src: string): Promise<{ width: number; height: number }> {
  if (!cache.has(src)) {
    const meta = await sharp(path.join('public', src.replace(/^\//, ''))).metadata();
    if (!meta.width || !meta.height) throw new Error(`Could not read dimensions of ${src}`);
    cache.set(src, { width: meta.width, height: meta.height });
  }
  return cache.get(src)!;
}

export function isPortrait({ width, height }: { width: number; height: number }): boolean {
  return height > width;
}
