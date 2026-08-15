/** Pixel crop rectangle within the SOURCE image, as reported by react-easy-crop's onCropComplete. */
export interface MhdCropPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Draws the cropped rectangle of `imageSrc` onto an offscreen canvas and
 * exports it as a JPEG blob, normalized to `outputSize` x `outputSize`
 * regardless of the source image's resolution or format (PNG/WEBP sources
 * both flatten to JPEG here — fine for a photo, not meant for anything
 * relying on transparency). 512px is comfortable headroom for every current
 * avatar size in the app (24px list rows up to 128px greeting hero) without
 * keeping full-resolution source photos around.
 */
export function mhdCropImageToBlob(
  imageSrc: string,
  cropPixels: MhdCropPixels,
  outputSize = 512,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Unable to create canvas context for photo crop.'));
        return;
      }

      ctx.drawImage(
        image,
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
