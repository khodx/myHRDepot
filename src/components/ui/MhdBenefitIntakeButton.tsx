import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import MhdBenefitIntakeModal from './MhdBenefitIntakeModal';
import type { MhdBenefitIntakeResult } from '@/features/benefit-intake/Types';

interface MhdBenefitIntakeButtonProps {
  onSubmitted?: (result: MhdBenefitIntakeResult) => void;
  defaultOpen?: boolean;
  label?: string;
}

export function MhdBenefitIntakeButton({
  onSubmitted,
  defaultOpen = false,
  label = 'Start Request',
}: MhdBenefitIntakeButtonProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{label}</Button>
      {open ? (
        <MhdBenefitIntakeModal
          open
          onClose={() => setOpen(false)}
          onSubmitted={(result) => onSubmitted?.(result)}
        />
      ) : null}
    </>
  );
}

export default MhdBenefitIntakeButton;
