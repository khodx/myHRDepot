import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import {
  useMhdDeleteTrainingCurriculum,
  useMhdTrainingCurriculums,
} from '../Hook';
import type { MhdTrainingCurriculum } from '../Types';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdTrainingContentWizard } from './MhdTrainingContentWizard';

export function MhdTrainingCurriculaPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const list = useMhdTrainingCurriculums(companyId, true);
  const remove = useMhdDeleteTrainingCurriculum();
  const [editing, setEditing] = useState<MhdTrainingCurriculum | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      {open ? <MhdTrainingContentWizard entityType="CURRICULUM" companyId={companyId} entityId={editing?.id ?? null} onClose={() => { setOpen(false); setEditing(null); }} /> : null}
    </div>
  );
}

export default MhdTrainingCurriculaPage;
