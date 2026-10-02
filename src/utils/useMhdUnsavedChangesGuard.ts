import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Protects unsaved input from an accidental exit.
 *
 * The app runs on `BrowserRouter`, which has no `useBlocker`, so the guard is built
 * from what the browser does allow:
 * - closing or reloading the tab raises the browser's own "leave site?" prompt;
 * - clicking any in-app link (sidebar, header, breadcrumbs) is intercepted and turned
 *   into a pending path the page confirms before navigating;
 * - a page's own Cancel/Back button calls `requestLeave`, which confirms the same way.
 *
 * The browser's Back button cannot be intercepted without a data router, so it is not
 * covered; moving to a data router is a separate, app-wide change.
 */
export function useMhdUnsavedChangesGuard(active: boolean) {
  const navigate = useNavigate();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const destination = `${url.pathname}${url.search}${url.hash}`;
      const here = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (destination === here) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingPath(destination);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [active]);

  /** Navigates straight away when nothing is at risk; otherwise asks first. */
  const requestLeave = useCallback(
    (path: string) => {
      if (active) {
        setPendingPath(path);
        return;
      }
      navigate(path);
    },
    [active, navigate],
  );

  const confirmLeave = useCallback(() => {
    const path = pendingPath;
    setPendingPath(null);
    if (path) navigate(path);
  }, [navigate, pendingPath]);

  const stay = useCallback(() => setPendingPath(null), []);

  return { pendingPath, requestLeave, confirmLeave, stay };
}
