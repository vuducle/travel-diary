import * as path from 'path';
import { promises as fs } from 'fs';

export interface OptimizeOptions {
  quality?: number; // 1-100
  maxWidth?: number; // px
  maxHeight?: number; // px
  format?: 'webp' | 'jpeg' | 'png';
  suffix?: string; // e.g., '-opt'
}

/**
 * Optimize an image for the web: resize to fit within maxWidth/maxHeight and convert to WebP (default).
 * Returns the public URL (rooted at /) to the optimized image and deletes the original file.
 */
type SharpModule = typeof import('sharp');
let _sharp: SharpModule | null | undefined;
async function getSharp(): Promise<SharpModule | null> {
  if (_sharp === undefined) {
    try {
      const mod: unknown = await import('sharp');
      const maybe = mod as { default?: SharpModule } | SharpModule;
      const withDefault = maybe as { default?: SharpModule };
      _sharp = withDefault.default
        ? withDefault.default
        : (maybe as SharpModule);
    } catch {
      _sharp = null;
    }
  }
  return _sharp ?? null;
}

export async function optimizeImageForWeb(
  inputAbsPath: string,
  options: OptimizeOptions = {},
) {
  const {
    quality = 80,
    maxWidth = 1600,
    maxHeight = 1600,
    format = 'webp',
    suffix = '-opt',
  } = options;

  const dir = path.dirname(inputAbsPath);
  const base = path.basename(inputAbsPath, path.extname(inputAbsPath));
  const outExt =
    format === 'webp' ? '.webp' : format === 'jpeg' ? '.jpg' : '.png';
  let outputAbsPath = path.join(dir, `${base}${suffix}${outExt}`);
  // Ensure output path is not identical to input path
  if (path.resolve(outputAbsPath) === path.resolve(inputAbsPath)) {
    outputAbsPath = path.join(dir, `${base}-opt${outExt}`);
  }

  const sharp = await getSharp();
  if (sharp) {
    const pipeline = sharp(inputAbsPath).rotate();
    pipeline.resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });
    if (format === 'webp') pipeline.webp({ quality, effort: 4 });
    else if (format === 'jpeg') pipeline.jpeg({ quality, progressive: true });
    else if (format === 'png') pipeline.png({ compressionLevel: 9 });

    await pipeline.toFile(outputAbsPath);

    // Delete original file (best-effort)
    try {
      await fs.unlink(inputAbsPath);
    } catch {
      // ignore unlink errors
    }
  } else {
    // Sharp not installed: no-op optimization; keep original
    const relOrig = path
      .relative(process.cwd(), inputAbsPath)
      .split(path.sep)
      .join('/');
    const publicUrlOrig = '/' + relOrig;
    return { outputAbsPath: inputAbsPath, publicUrl: publicUrlOrig };
  }

  // Build public URL from absolute path
  const rel = path
    .relative(process.cwd(), outputAbsPath)
    .split(path.sep)
    .join('/');
  const publicUrl = '/' + rel;
  return { outputAbsPath, publicUrl };
}

export async function optimizeTripCover(inputAbsPath: string) {
  return optimizeImageForWeb(inputAbsPath, {
    quality: 80,
    maxWidth: 1600,
    maxHeight: 1600,
    format: 'webp',
    suffix: '',
  });
}

export async function optimizeAvatar(inputAbsPath: string) {
  return optimizeImageForWeb(inputAbsPath, {
    quality: 80,
    maxWidth: 512,
    maxHeight: 512,
    format: 'webp',
    suffix: '',
  });
}

export async function optimizeCoverImage(inputAbsPath: string) {
  return optimizeImageForWeb(inputAbsPath, {
    quality: 80,
    maxWidth: 1584,
    maxHeight: 396,
    format: 'webp',
    suffix: '',
  });
}

export async function optimizeEntryImage(inputAbsPath: string) {
  return optimizeImageForWeb(inputAbsPath, {
    quality: 80,
    maxWidth: 1600,
    maxHeight: 1600,
    format: 'webp',
    suffix: '',
  });
}
