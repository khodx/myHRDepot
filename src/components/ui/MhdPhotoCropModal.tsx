import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/Button';
import { MhdModal } from '@/components/ui/MhdModal';
import { mhdCropImageToBlob } from '@/utils/mhdCropImage';

interface MhdPhotoCropModalProps {
  /** Object URL of the just-picked file. Caller owns it and must revoke it
   *  after this modal closes (on both confirm and cancel). */
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
 * upload uses (Slack, GitHub, LinkedIn, Google) — chosen over automated
 * face-detection cropping because it needs no ML/vision dependency, works
 * for photos automated detection would get wrong (angled faces, glasses,
 * group photos), and gives the uploader direct control over a photo of
 * themselves rather than an algorithm's guess.
 */
export function MhdPhotoCropModal({ imageSrc, onCancel, onConfirm }: MhdPhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCropComplete = useCallback((_croppedArea: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setError(null);
    setIsProcessing(true);
    try {
      const blob = await mhdCropImageToBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to crop photo.');
      setIsProcessing(false);
    }
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
            aspect={1}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="mhd-photo-crop-zoom" className="text-xs font-medium text-muted-foreground">
            Zoom
          </label>
          <input
            id="mhd-photo-crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="flex-1"
          />
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
