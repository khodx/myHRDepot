import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import MhdBenefitIntakeModal from './MhdBenefitIntakeModal';
import type { MhdBenefitIntakeResult } from '../Types';

interface MhdBenefitIntakeButtonProps {
  onSubmitted?: (result: MhdBenefitIntakeResult) => void;
  defaultOpen?: boolean;
}

export function MhdBenefitIntakeButton({
  onSubmitted,
  defaultOpen = false,
}: MhdBenefitIntakeButtonProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Start Request</Button>
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
