import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdDeleteTrainingProgram,
  useMhdTrainingCurriculums,
  useMhdTrainingCourses,
  useMhdTrainingPrograms,
} from '../Hook';
import type { MhdTrainingProgram } from '../Types';
import { MhdTrainingContentWizard } from './MhdTrainingContentWizard';
export function MhdTrainingProgramsPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const list = useMhdTrainingPrograms({ companyId, includeInactive: true });
  const curricula = useMhdTrainingCurriculums(companyId, true);
  const courses = useMhdTrainingCourses({ companyId, includeInactive: true });
  const remove = useMhdDeleteTrainingProgram();
  const [editing, setEditing] = useState<MhdTrainingProgram | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
                <MhdTd className="font-medium">
                  {item.title}
                  {courses.data?.every((course) => course.programId !== item.id) ? (
                    <MhdBadge variant="neutral" className="ml-2">
                      Empty
                    </MhdBadge>
                  ) : null}
                </MhdTd>
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
        <MhdTrainingContentWizard
          entityType="PROGRAM"
          companyId={companyId}
          entityId={editing?.id ?? null}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}
export default MhdTrainingProgramsPage;
