'use client';
import { useEffect, useRef, useState } from 'react';
import { useBlocks } from '@/lib/hooks';
import { reportsApi } from '@/lib/api';

interface Props {
  targetUserId: string;
  targetHandle?: string | null;
}

/**
 * Three-dot menu for actions you take *on someone else* — Block, Report.
 * Shown on the public profile page when viewing another user.
 */
export default function UserActionsMenu({ targetUserId, targetHandle }: Props) {
  const { blocked, block, unblock } = useBlocks();
  const isBlocked = blocked.some((b) => b.userId === targetUserId);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const wrap = (fn: () => Promise<unknown>) => async () => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const onBlockToggle = wrap(() =>
    isBlocked ? unblock(targetUserId) : block(targetUserId),
  );

  const onReport = wrap(async () => {
    const reason = window.prompt(
      `Report ${targetHandle ? `@${targetHandle}` : 'this user'}? Tell us briefly why (optional, max 500):`,
      '',
    );
    if (reason === null) return; // cancelled
    await reportsApi.add('user', targetUserId, reason);
    window.alert('Thanks. We’ll take a look.');
  });

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        className="h-9 w-9 grid place-items-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition focus:outline-none focus:ring-2 focus:ring-coral-400/40"
      >
        <span className="text-xl leading-none" aria-hidden="true">⋯</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/40 overflow-hidden z-30"
        >
          <button
            role="menuitem"
            type="button"
            onClick={onBlockToggle}
            disabled={busy}
            className="block w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-coral-300 transition"
          >
            {isBlocked ? 'Unblock' : 'Block'}
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={onReport}
            disabled={busy}
            className="block w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-coral-300 transition border-t border-zinc-800"
          >
            Report
          </button>
        </div>
      )}
    </div>
  );
}
