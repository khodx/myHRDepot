import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdAvatarCircle } from '@/components/ui/MhdAvatar';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPhotoCropModal } from '@/components/ui/MhdPhotoCropModal';
import { useMhdPersonPhotoUrl } from '@/features/people/Hook';
import { mhdPersonService } from '@/features/people/Service';
import type { MhdPerson } from '@/features/people/Types';

// Mirrors the person-photos bucket's allowed_mime_types/file_size_limit
// (0156_person_photos.sql) — validated here too so a rejected upload fails
// fast client-side instead of round-tripping to Storage first.
const MHD_ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MHD_MAX_PHOTO_BYTES = 5 * 1024 * 1024;

interface MhdPersonPhotoUploaderProps {
  person: MhdPerson;
  /** Called after a successful upload/remove with the new photoPath, so the
   *  caller can update its own cached person record without a full refetch. */
  onPhotoChanged: (photoPath: string | null) => void;
}

/**
 * Self-service (own record) or HR-managed (any person in the company) photo
 * upload — the RPC (mhd_set_person_photo) enforces which of those applies to
 * the caller, so this component doesn't need to branch on role itself. Lives
 * on the Person edit form, the one place both a signed-in user editing their
 * own record and HR editing someone without login access already meet.
 */
export function MhdPersonPhotoUploader({ person, onPhotoChanged }: MhdPersonPhotoUploaderProps) {
  const photoUrlQuery = useMhdPersonPhotoUrl(person.photoPath);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    // Reset so choosing the same file again still fires a change event.
    event.target.value = '';
    if (!file) return;

    if (!MHD_ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setError('Photo must be a JPEG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MHD_MAX_PHOTO_BYTES) {
      setError('Photo must be 5 MB or smaller.');
      return;
    }

    setError(null);
    // The picked file is never uploaded directly — mhd-photo-crop-modal.tsx
    // lets the uploader frame their own face before anything is saved,
    // rather than trusting whatever the source photo's center-crop lands on.
    setCropImageUrl(URL.createObjectURL(file));
  }

  function handleCropCancel() {
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
    }
    setCropImageUrl(null);
  }

  async function handleCropConfirm(blob: Blob) {
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
    }
    setCropImageUrl(null);

    const croppedFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    setError(null);
    setIsSaving(true);
    try {
      const photoPath = await mhdPersonService.uploadPersonPhoto({
        personId: person.id,
        companyId: person.companyId,
        file: croppedFile,
        previousPhotoPath: person.photoPath,
      });
      onPhotoChanged(photoPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload photo.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setIsSaving(true);
    try {
      await mhdPersonService.removePersonPhoto(person.id, person.photoPath);
      onPhotoChanged(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove photo.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <MhdCard className="flex items-center gap-4 p-5">
      <MhdAvatarCircle name={person.displayName} photoUrl={photoUrlQuery.data} size="lg" />
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium text-foreground">Profile Photo</p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={isSaving}
            onClick={() => inputRef.current?.click()}
          >
            {isSaving ? 'Saving...' : person.photoPath ? 'Change Photo' : 'Upload Photo'}
          </Button>
          {person.photoPath && (
            <Button variant="ghost" disabled={isSaving} onClick={() => void handleRemove()}>
              Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={MHD_ALLOWED_PHOTO_TYPES.join(',')}
          className="hidden"
          onChange={handleFileChange}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {cropImageUrl && (
        <MhdPhotoCropModal
          imageSrc={cropImageUrl}
          onCancel={handleCropCancel}
          onConfirm={(blob) => void handleCropConfirm(blob)}
        />
      )}
    </MhdCard>
  );
}
