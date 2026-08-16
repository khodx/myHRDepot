import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { getInitialCropFromCroppedAreaPixels, type MediaSize, type Size, type Area } from 'react-easy-crop';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdModal } from '@/components/ui/MhdModal';
import { mhdCropImageToBlob } from '@/utils/mhdCropImage';
import { mhdDetectFaceSquareArea } from '@/utils/mhdFaceDetection';

const MHD_CROP_MIN_ZOOM = 1;
const MHD_CROP_MAX_ZOOM = 3;
/** Pixels the photo shifts per arrow-button click — a fine nudge for
 *  alignment past what dragging with a mouse can reliably land on. */
const MHD_CROP_NUDGE_STEP = 5;

interface MhdPhotoCropModalProps {
  /** Either an object URL of a just-picked file (caller owns it and must
   *  revoke it after this modal closes, on both confirm and cancel) or an
   *  already-uploaded photo's remote URL, for re-editing an existing crop.
   *  mhdCropImageToBlob's export step needs the source loadable with
   *  crossOrigin="anonymous" for the latter case to avoid a tainted canvas. */
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

/**
 * Manual crop-before-upload step for any square-photo upload flow in the
 * app (currently just person photos, but built as a shared primitive rather
 * than a one-off inside the People feature — see CLAUDE.md's "engines, not
 * per-feature copies" standard). Lets the uploader drag/zoom their own photo
 * into frame before it's saved, the same pattern every product with avatar
 * upload uses (Slack, GitHub, LinkedIn, Google).
 *
 * The starting frame is auto-suggested when the browser's Shape Detection
 * API (FaceDetector) finds a face — see mhdFaceDetection.ts — but that's
 * only ever a starting point: manual control stays the source of truth, so
 * angled faces, glasses, group photos, or browsers without FaceDetector all
 * still work, just starting from the plain centered crop instead.
 */
export function MhdPhotoCropModal({ imageSrc, onCancel, onConfirm }: MhdPhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didSuggestFace, setDidSuggestFace] = useState(false);

  // Face detection (async) and the Cropper's own layout callbacks
  // (onMediaLoaded/onCropSizeChange) resolve independently and in no fixed
  // order. This ref assembles the three pieces without triggering a render
  // per piece; the crop only jumps to the suggested framing once, the
  // instant all three are in — from whichever of those callbacks arrives
  // last, never from a bare effect body (avoids react-hooks/set-state-in-effect).
  const suggestionRef = useRef<{
    area: Area | null;
    media: MediaSize | null;
    size: Size | null;
    applied: boolean;
  }>({ area: null, media: null, size: null, applied: false });

  function applyFaceSuggestionIfReady() {
    const s = suggestionRef.current;
    if (s.applied || !s.area || !s.media || !s.size) return;
    s.applied = true;
    const initial = getInitialCropFromCroppedAreaPixels(
      s.area,
      s.media,
      0,
      s.size,
      MHD_CROP_MIN_ZOOM,
      MHD_CROP_MAX_ZOOM,
    );
    setCrop(initial.crop);
    setZoom(initial.zoom);
    setDidSuggestFace(true);
  }

  useEffect(() => {
    let cancelled = false;
    void mhdDetectFaceSquareArea(imageSrc).then((area) => {
      if (!cancelled && area) {
        suggestionRef.current.area = area;
        applyFaceSuggestionIfReady();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  function handleMediaLoaded(size: MediaSize) {
    suggestionRef.current.media = size;
    applyFaceSuggestionIfReady();
  }

  function handleCropSizeChange(size: Size) {
    suggestionRef.current.size = size;
    applyFaceSuggestionIfReady();
  }

  const handleCropComplete = useCallback((_croppedArea: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setError(null);
    setIsProcessing(true);
    try {
      const blob = await mhdCropImageToBlob(imageSrc, croppedAreaPixels, rotation);
      onConfirm(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to crop photo.');
      setIsProcessing(false);
    }
  }

  // Wraps into (-180, 180] rather than letting repeated quick-rotate clicks
  // grow the value unbounded — the slider below shares this same range, so
  // a quick-rotate click always lands somewhere the slider can also reach.
  function nudgeRotation(deltaDegrees: number) {
    setRotation((current) => (((current + deltaDegrees + 180) % 360) + 360) % 360 - 180);
  }

  // crop.x/crop.y are the photo's own pixel offset (react-easy-crop moves
  // the image under a fixed frame, not the frame over the image), so a
  // positive dx/dy here matches dragging the photo itself right/down —
  // same direction a mouse drag in that direction would produce.
  function nudgeCrop(dx: number, dy: number) {
    setCrop((current) => ({ x: current.x + dx, y: current.y + dy }));
  }

  return (
    <MhdModal
      onClose={onCancel}
      title="Crop Photo"
      className="relative flex w-full max-w-lg flex-col rounded-lg border border-border bg-background shadow-xl"
    >
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Crop Photo</h2>

        <div className="relative h-80 w-full overflow-hidden rounded-md bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            minZoom={MHD_CROP_MIN_ZOOM}
            maxZoom={MHD_CROP_MAX_ZOOM}
            aspect={1}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            onMediaLoaded={handleMediaLoaded}
            onCropSizeChange={handleCropSizeChange}
          />
        </div>

        {didSuggestFace && (
          <p className="text-xs text-muted-foreground">
            Framed around the detected face — drag or zoom to adjust.
          </p>
        )}

        <div className="flex items-center gap-3">
          <label htmlFor="mhd-photo-crop-zoom" className="text-xs font-medium text-muted-foreground">
            Zoom
          </label>
          <input
            id="mhd-photo-crop-zoom"
            type="range"
            min={MHD_CROP_MIN_ZOOM}
            max={MHD_CROP_MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="flex-1"
          />
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="mhd-photo-crop-rotation" className="text-xs font-medium text-muted-foreground">
            Rotate
          </label>
          <button
            type="button"
            onClick={() => nudgeRotation(-90)}
            title="Rotate 90° left"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            <span className="sr-only">Rotate 90° left</span>
          </button>
          <input
            id="mhd-photo-crop-rotation"
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotation}
            onChange={(event) => setRotation(Number(event.target.value))}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => nudgeRotation(90)}
            title="Rotate 90° right"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCw className="h-4 w-4" aria-hidden />
            <span className="sr-only">Rotate 90° right</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span id="mhd-photo-crop-position-label" className="text-xs font-medium text-muted-foreground">
            Position
          </span>
          <div
            role="group"
            aria-labelledby="mhd-photo-crop-position-label"
            className="grid w-[84px] grid-cols-3 grid-rows-3 gap-1"
          >
            <span />
            <button
              type="button"
              onClick={() => nudgeCrop(0, -MHD_CROP_NUDGE_STEP)}
              title="Move photo up"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
              <span className="sr-only">Move photo up</span>
            </button>
            <span />
            <button
              type="button"
              onClick={() => nudgeCrop(-MHD_CROP_NUDGE_STEP, 0)}
              title="Move photo left"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="sr-only">Move photo left</span>
            </button>
            <span />
            <button
              type="button"
              onClick={() => nudgeCrop(MHD_CROP_NUDGE_STEP, 0)}
              title="Move photo right"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              <span className="sr-only">Move photo right</span>
            </button>
            <span />
            <button
              type="button"
              onClick={() => nudgeCrop(0, MHD_CROP_NUDGE_STEP)}
              title="Move photo down"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowDown className="h-4 w-4" aria-hidden />
              <span className="sr-only">Move photo down</span>
            </button>
            <span />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleConfirm()}
            disabled={isProcessing || !croppedAreaPixels}
          >
            {isProcessing ? 'Saving...' : 'Save Photo'}
          </Button>
        </div>
      </div>
    </MhdModal>
  );
}
