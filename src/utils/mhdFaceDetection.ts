import type { FaceDetector as MhdMediapipeFaceDetector } from '@mediapipe/tasks-vision';

export interface MhdFaceSquareArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Expands the detected face bounding box into a square that includes some
// head/shoulder margin — a tight face-only crop looks wrong for a profile
// photo. 1.6x mirrors how most avatar-crop tools frame a headshot.
const MHD_FACE_CROP_PADDING_FACTOR = 1.6;

// MediaPipe's own CDN-hosted WASM runtime and pre-trained short-range face
// model (BlazeFace, float16, ~200KB). Both are fetched lazily — only when a
// photo is picked for cropping, never as part of the app's main bundle — and
// the browser caches them across uploads via standard HTTP caching. Nothing
// about the uploaded photo itself ever leaves the browser: only this fixed,
// content-free runtime/model pair is fetched from Google's CDN, and the
// actual detection runs locally in WASM.
const MHD_FACE_DETECTOR_WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MHD_FACE_DETECTOR_MODEL_CDN =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

// Created once per page session and reused — standing up the WASM runtime
// and downloading the model has real latency, not worth repeating per photo.
let mhdFaceDetectorPromise: Promise<MhdMediapipeFaceDetector | null> | null = null;

function mhdGetFaceDetector(): Promise<MhdMediapipeFaceDetector | null> {
  if (!mhdFaceDetectorPromise) {
    mhdFaceDetectorPromise = (async () => {
      try {
        const { FilesetResolver, FaceDetector } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(MHD_FACE_DETECTOR_WASM_CDN);
        return await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MHD_FACE_DETECTOR_MODEL_CDN },
          runningMode: 'IMAGE',
        });
      } catch {
        // Offline, CDN unreachable, unsupported browser (no WASM/SIMD),
        // etc. — every caller treats this the same as "no face found."
        return null;
      }
    })();
  }
  return mhdFaceDetectorPromise;
}

/**
 * Detects the largest face in `imageSrc` and returns a square region (in the
 * image's natural pixel coordinates, the same space react-easy-crop's
 * croppedAreaPixels uses) suitable as a starting crop suggestion —
 * still just a *suggestion*: the manual crop UI always renders on top of
 * this, so the person can adjust or ignore it entirely.
 *
 * Returns null whenever a suggestion can't be produced — detector unavailable,
 * no face found, a decode failure — and every caller treats null the same
 * way: fall back to the crop tool's normal centered start. This is a nicety
 * layered on top of a fully working manual crop, not a dependency the
 * feature needs to function.
 */
export async function mhdDetectFaceSquareArea(imageSrc: string): Promise<MhdFaceSquareArea | null> {
  const image = new Image();
  image.src = imageSrc;
  try {
    await image.decode();
  } catch {
    return null;
  }

  const detector = await mhdGetFaceDetector();
  if (!detector) {
    return null;
  }

  try {
    const result = detector.detect(image);
    const detection = result.detections[0];
    if (!detection?.boundingBox) {
      return null;
    }

    const { originX, originY, width, height } = detection.boundingBox;
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const size = Math.min(
      Math.max(width, height) * MHD_FACE_CROP_PADDING_FACTOR,
      naturalWidth,
      naturalHeight,
    );
    const centerX = originX + width / 2;
    const centerY = originY + height / 2;

    return {
      x: Math.max(0, Math.min(centerX - size / 2, naturalWidth - size)),
      y: Math.max(0, Math.min(centerY - size / 2, naturalHeight - size)),
      width: size,
      height: size,
    };
  } catch {
    return null;
  }
}
