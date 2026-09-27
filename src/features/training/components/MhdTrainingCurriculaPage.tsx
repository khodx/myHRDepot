import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import {
  useMhdCreateTrainingCurriculum,
  useMhdDeleteTrainingCurriculum,
  useMhdTrainingCurriculums,
  useMhdUpdateTrainingCurriculum,
} from '../Hook';
import type { MhdTrainingCurriculum } from '../Types';
import { useMhdAuth } from '@/features/authentication/Hook';

export function MhdTrainingCurriculaPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const list = useMhdTrainingCurriculums(companyId, true);
  const create = useMhdCreateTrainingCurriculum();
  const update = useMhdUpdateTrainingCurriculum();
  const remove = useMhdDeleteTrainingCurriculum();
  const [editing, setEditing] = useState<MhdTrainingCurriculum | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);
    try {
      if (editing)
        await update.mutateAsync({
          curriculumId: editing.id,
          title: String(data.get('title')),
          description: String(data.get('description') || ''),
          isActive: data.get('isActive') === 'on',
        });
      else
        await create.mutateAsync({
          companyId,
          title: String(data.get('title')),
          description: String(data.get('description') || ''),
        });
      setOpen(false);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save curriculum.');
    }
  }
  async function deleteOne(item: MhdTrainingCurriculum) {
    if (!window.confirm(`Delete curriculum “${item.title}”?`)) return;
    setError(null);
    try {
      await remove.mutateAsync(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete curriculum.');
    }
  }
  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Curricula"
        description="Organize related training programs."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            New Curriculum
          </Button>
        }
      />
      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}
      <MhdCard className="overflow-hidden p-0">
        <MhdTable>
          <thead>
            <tr>
              <MhdTh>Title</MhdTh>
              <MhdTh>Description</MhdTh>
              <MhdTh>Active</MhdTh>
              <MhdTh />
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((item) => (
              <MhdTr key={item.id}>
                <MhdTd className="font-medium">{item.title}</MhdTd>
                <MhdTd>{item.description || '—'}</MhdTd>
                <MhdTd>
                  <MhdBadge variant={item.isActive ? 'success' : 'neutral'}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </MhdBadge>
                </MhdTd>
                <MhdTd className="text-right">
                  <button
                    className="mr-3 text-sm text-accent"
                    onClick={() => {
                      setEditing(item);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button className="text-sm text-red-700" onClick={() => void deleteOne(item)}>
                    Delete
                  </button>
                </MhdTd>
              </MhdTr>
            ))}
          </tbody>
        </MhdTable>
      </MhdCard>
      {open ? (
        <MhdModal
          title={editing ? 'Edit Curriculum' : 'New Curriculum'}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
        >
          <form onSubmit={save} className="space-y-4">
            <MhdFormFieldStack>
              <div>
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  required
                  defaultValue={editing?.title ?? ''}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={editing?.description ?? ''}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                />
              </div>
              {editing ? (
                <label className="flex gap-2">
                  <input type="checkbox" name="isActive" defaultChecked={editing.isActive} /> Active
                </label>
              ) : null}
            </MhdFormFieldStack>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </MhdModal>
      ) : null}
    </div>
  );
}

export default MhdTrainingCurriculaPage;
