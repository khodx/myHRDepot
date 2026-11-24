import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { MhdDateField } from '../MhdDateField';

function Harness({ inDialog }: { inDialog: boolean }) {
  const [value, setValue] = useState('');
  const field = <MhdDateField aria-label="Due date" value={value} onChange={setValue} />;
  return inDialog ? (
    <div role="dialog" aria-label="Test dialog">
      <div style={{ overflow: 'auto', maxHeight: 40 }}>{field}</div>
    </div>
  ) : (
    field
  );
}

describe('MhdDateField calendar', () => {
  it('renders the calendar in the enclosing dialog, outside a scrolling body, so it is not clipped', () => {
    render(<Harness inDialog />);
    fireEvent.focus(screen.getByLabelText('Due date'));
    const dialog = screen.getByRole('dialog');
    const nextMonth = screen.getByRole('button', { name: 'Next month' });
    expect(dialog.contains(nextMonth)).toBe(true);
    expect(nextMonth.closest('[style*="overflow"]')).toBeNull();
    expect(nextMonth.closest('[style*="fixed"]')).not.toBeNull();
  });

  it('renders the calendar in the body when there is no dialog', () => {
    render(<Harness inDialog={false} />);
    fireEvent.focus(screen.getByLabelText('Due date'));
    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument();
  });

  it('picks a day from the portaled calendar and closes it', () => {
    render(<Harness inDialog />);
    const input = screen.getByLabelText('Due date');
    fireEvent.focus(input);
    fireEvent.click(screen.getByRole('button', { name: '15' }));
    expect((input as HTMLInputElement).value).toMatch(/^\d{2}\/15\/\d{4}$/);
    expect(screen.queryByRole('button', { name: 'Next month' })).not.toBeInTheDocument();
  });

  it('keeps the calendar open when pressing inside it', () => {
    render(<Harness inDialog />);
    fireEvent.focus(screen.getByLabelText('Due date'));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument();
  });
});
