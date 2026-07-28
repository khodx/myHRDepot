import { useNavigate } from 'react-router-dom';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdFormRendererPage } from './MhdFormRendererPage';

/**
 * Modal-shell wrapper for `/forms/:formId/render` when reached via an in-app
 * link/navigate carrying `state.backgroundLocation` (see AppRouter's second
 * `<Routes>` block). Reuses `MhdFormRendererPage` as-is in `embedded` mode —
 * no forked/duplicated form-rendering logic.
 *
 * `navigate(-1)` is used to close rather than navigating to a computed path:
 * every call site that opens this route does so via `Link`/`navigate` with
 * `state`, which pushes a new history entry on top of the background page,
 * so popping one entry reliably lands back where the user was.
 */
export function MhdFormModalRoute() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <MhdModal onClose={handleClose} title="Form Renderer">
      <MhdFormRendererPage embedded />
    </MhdModal>
  );
}
