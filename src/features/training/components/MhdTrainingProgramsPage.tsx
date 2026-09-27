import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCreateTrainingProgram,
  useMhdDeleteTrainingProgram,
  useMhdTrainingCurriculums,
  useMhdTrainingPrograms,
  useMhdUpdateTrainingProgram,
} from '../Hook';
import type { MhdTrainingProgram } from '../Types';
export function MhdTrainingProgramsPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const list = useMhdTrainingPrograms({ companyId, includeInactive: true });
  const curricula = useMhdTrainingCurriculums(companyId, true);
  const create = useMhdCreateTrainingProgram();
  const update = useMhdUpdateTrainingProgram();
  const remove = useMhdDeleteTrainingProgram();
  const [editing, setEditing] = useState<MhdTrainingProgram | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);
    const curriculumId = String(data.get('curriculumId') || '') || null;
    try {
      if (editing)
        await update.mutateAsync({
          programId: editing.id,
          title: String(data.get('title')),
          description: String(data.get('description') || ''),
          curriculumId,
          sortOrder: Number(data.get('sortOrder') || 0),
          isActive: data.get('isActive') === 'on',
        });
      else
        await create.mutateAsync({
          companyId,
          title: String(data.get('title')),
          description: String(data.get('description') || ''),
          curriculumId,
          sortOrder: Number(data.get('sortOrder') || 0),
        });
      setOpen(false);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save program.');
    }
  }
  async function deleteOne(item: MhdTrainingProgram) {
    if (!window.confirm(`Delete program “${item.title}”?`)) return;
    try {
      await remove.mutateAsync(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete program.');
    }
  }
  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Programs"
        description="Group courses into ordered learning programs."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            New Program
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
              <MhdTh>Curriculum</MhdTh>
              <MhdTh>Sort order</MhdTh>
              <MhdTh>Active</MhdTh>
              <MhdTh />
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((item) => (
              <MhdTr key={item.id}>
                <MhdTd className="font-medium">{item.title}</MhdTd>
                <MhdTd>
                  {curricula.data?.find((c) => c.id === item.curriculumId)?.title ?? '—'}
                </MhdTd>
                <MhdTd>{item.sortOrder}</MhdTd>
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
          title={editing ? 'Edit Program' : 'New Program'}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
        >
          <form onSubmit={save} className="space-y-4">
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
              <label htmlFor="curriculumId">Curriculum</label>
              <select
                id="curriculumId"
                name="curriculumId"
                defaultValue={editing?.curriculumId ?? ''}
                className="mt-1 w-full rounded-md border border-border px-3 py-2"
              >
                <option value="">No curriculum</option>
                {(curricula.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
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
            <div>
              <label htmlFor="sortOrder">Sort order</label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={editing?.sortOrder ?? 0}
                className="mt-1 w-full rounded-md border border-border px-3 py-2"
              />
            </div>
            {editing ? (
              <label className="flex gap-2">
                <input type="checkbox" name="isActive" defaultChecked={editing.isActive} /> Active
              </label>
            ) : null}
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
export default MhdTrainingProgramsPage;
