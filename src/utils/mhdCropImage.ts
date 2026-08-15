/** Pixel crop rectangle within the SOURCE image, as reported by react-easy-crop's onCropComplete. */
export interface MhdCropPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

function mhdGetRadianAngle(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Bounding box of `width`x`height` once rotated by `rotation` degrees. */
function mhdRotatedBoundingBox(width: number, height: number, rotation: number) {
  const rotRad = mhdGetRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Draws the cropped rectangle of `imageSrc` onto an offscreen canvas and
 * exports it as a JPEG blob, normalized to `outputSize` x `outputSize`
 * regardless of the source image's resolution or format (PNG/WEBP sources
 * both flatten to JPEG here — fine for a photo, not meant for anything
 * relying on transparency). 512px is comfortable headroom for every current
 * avatar size in the app (24px list rows up to 128px greeting hero) without
 * keeping full-resolution source photos around.
 *
 * `rotation` (degrees) is applied by first rendering the whole source image
 * rotated onto an intermediate canvas sized to its rotated bounding box, then
 * cropping from that — `cropPixels` from react-easy-crop's onCropComplete are
 * already expressed in that same rotated-bounding-box coordinate space
 * whenever a nonzero `rotation` is passed to its Cropper, so this must mirror
 * that intermediate step rather than rotating during the final crop draw.
 */
export function mhdCropImageToBlob(
  imageSrc: string,
  cropPixels: MhdCropPixels,
  rotation = 0,
  outputSize = 512,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Required for re-editing an already-uploaded photo: imageSrc there is a
    // cross-origin Supabase Storage signed URL rather than a same-origin
    // blob: URL from a freshly picked file, and drawing a cross-origin image
    // onto a canvas without this taints it — toBlob() then throws
    // ("Tainted canvases may not be exported") instead of returning a blob.
    // A no-op for blob:/data: sources, which are already same-origin.
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const { width: bboxWidth, height: bboxHeight } = mhdRotatedBoundingBox(
        image.width,
        image.height,
        rotation,
      );

      const rotatedCanvas = document.createElement('canvas');
      rotatedCanvas.width = bboxWidth;
      rotatedCanvas.height = bboxHeight;
      const rotatedCtx = rotatedCanvas.getContext('2d');
      if (!rotatedCtx) {
        reject(new Error('Unable to create canvas context for photo crop.'));
        return;
      }

      rotatedCtx.translate(bboxWidth / 2, bboxHeight / 2);
      rotatedCtx.rotate(mhdGetRadianAngle(rotation));
      rotatedCtx.translate(-image.width / 2, -image.height / 2);
      rotatedCtx.drawImage(image, 0, 0);

      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Unable to create canvas context for photo crop.'));
        return;
      }

      ctx.drawImage(
        rotatedCanvas,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        outputSize,
        outputSize,
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Unable to export the cropped photo.'));
          }
        },
        'image/jpeg',
        0.92,
      );
    };
    image.onerror = () => reject(new Error('Unable to load the photo for cropping.'));
    image.src = imageSrc;
  });
}
