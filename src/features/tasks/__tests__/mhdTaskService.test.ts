import { describe, expect, it } from 'vitest';
import type { MhdTask } from '../Types';

describe('MhdTask type contract', () => {
  it('supports the Task Management MVP row shape', () => {
    const task: MhdTask = {
      id: '11111111-1111-4111-8111-111111111111',
      referenceId: 'TASK-000001',
      companyId: '22222222-2222-4222-8222-222222222222',
      companyName: 'Mission Pediatrics',
      title: 'Prepare weekly task report',
      descriptionPlainText: 'Compile open task list for client review.',
      descriptionRichText: null,
      statusId: '33333333-3333-4333-8333-333333333333',
      statusName: 'In Progress',
      statusColorToken: 'blue',
      priorityId: '44444444-4444-4444-8444-444444444444',
      priorityName: 'Normal',
      priorityColorToken: 'blue',
      startDate: '2026-07-05',
      dueDate: '2026-07-12',
      completedDate: null,
      manualProgressPercent: 50,
      // `overallProgressPercent` is a V2 idea, not a live column — the local
      // schema only carries manual + calculated progress (see ../Types.ts).
      calculatedProgressPercent: 0,
      assignedUserIds: ['55555555-5555-4555-8555-555555555555'],
      assignedDisplayNames: ['Marcel Furnace'],
      noteCount: 2,
      attachmentCount: 1,
      createdAt: '2026-07-05T00:00:00Z',
      createdBy: '66666666-6666-4666-8666-666666666666',
      updatedAt: '2026-07-05T00:00:00Z',
      updatedBy: '66666666-6666-4666-8666-666666666666',
    };

    expect(task.referenceId).toBe('TASK-000001');
    expect(task.assignedDisplayNames).toContain('Marcel Furnace');
  });
});
