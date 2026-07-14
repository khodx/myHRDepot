import { describe, expect, it } from 'vitest';
import { cn } from '@/utils/cn';

describe('cn utility', () => {
  it('merges conditional class names and resolves Tailwind conflicts', () => {
    const isHidden = false;
    expect(cn('px-2', isHidden && 'hidden', 'px-4')).toBe('px-4');
  });
});
