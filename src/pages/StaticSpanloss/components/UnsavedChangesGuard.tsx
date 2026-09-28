import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

interface UnsavedChangesGuardProps {
  when: boolean;
  onSave?: () => Promise<void> | void;
}

export function UnsavedChangesGuard({ when, onSave }: UnsavedChangesGuardProps) {
  const [pendingNav, setPendingNav] = useState<null | (() => void)>(null);
  const [savingAndLeaving, setSavingAndLeaving] = useState(false);
  const whenRef = useRef(when);
  whenRef.current = when;

  useEffect(() => {
    if (!when) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when]);

  useEffect(() => {
    if (!when) return;
    const onClick = (e: MouseEvent) => {
      if (!whenRef.current) return;
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || anchor.target === '_blank') return;
      // Only intercept same-origin navigations
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      setPendingNav(() => () => {
        anchor.click();
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [when]);

  useEffect(() => {
    if (!when) return;
    window.history.pushState({ __unsavedGuard: true }, '');
    const onPop = () => {
      if (!whenRef.current) return;
      window.history.pushState({ __unsavedGuard: true }, '');
      setPendingNav(() => () => {
        window.history.go(-2);
      });
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
    };
  }, [when]);

  const handleStay = useCallback(() => setPendingNav(null), []);

  const handleLeave = useCallback(() => {
    const nav = pendingNav;
    whenRef.current = false;
    setPendingNav(null);
    if (nav) setTimeout(nav, 0);
  }, [pendingNav]);

  const handleSaveAndLeave = useCallback(async () => {
    if (!onSave) return handleLeave();
    try {
      setSavingAndLeaving(true);
      await onSave();
      handleLeave();
    } finally {
      setSavingAndLeaving(false);
    }
  }, [onSave, handleLeave]);

  return (
    <Dialog open={!!pendingNav} onClose={handleStay} maxWidth="xs" fullWidth>
      <DialogTitle>Unsaved changes</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have unsaved edits on this page. If you leave now, your changes will be lost.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleStay}>Stay on page</Button>
        <Button color="error" onClick={handleLeave} disabled={savingAndLeaving}>
          Discard & leave
        </Button>
        {onSave && (
          <Button variant="contained" onClick={handleSaveAndLeave} disabled={savingAndLeaving}>
            {savingAndLeaving ? 'Saving…' : 'Save & leave'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
