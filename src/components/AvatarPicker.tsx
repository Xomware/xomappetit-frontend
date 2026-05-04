'use client';
import { useRef, useState } from 'react';
import { AVATAR_SWATCHES, APP_DEFAULT_AVATAR_COLOR } from '@/lib/avatar-swatches';
import { usersApi } from '@/lib/users';
import StockAvatar from './StockAvatar';

type Choice =
  | { kind: 'photo'; url: string }
  | { kind: 'stock'; color: string };

interface Props {
  /** Currently-saved avatar URL (mutually exclusive with stockColor). */
  avatarUrl: string | null;
  /** Currently-saved stock-avatar color (mutually exclusive with avatarUrl). */
  stockColor: string | null;
  /** Past uploaded URLs the user can re-select. Most recent first. */
  history: string[];
  /** Pending in-flight changes that haven't been saved yet. */
  pending: Choice | null;
  /** Fired when the user picks a new option (photo from history, stock color, or fresh upload). */
  onChange: (choice: Choice) => void;
}

const ACCEPT = 'image/png,image/jpeg,image/webp';

/**
 * Three-row avatar picker:
 *  1. Big preview of the current/pending pick
 *  2. Stock — 8 colored swatches of the brand X-eyes mark
 *  3. Recent — past uploads (history)
 *  4. Upload-from-device button
 *
 * Pending state is local — the parent EditProfileModal saves it via
 * usersApi.edit() on form submit. Direct device uploads happen via
 * presigned PUT, then the new URL flows back through onChange.
 */
export default function AvatarPicker({
  avatarUrl,
  stockColor,
  history,
  pending,
  onChange,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // What's actually rendered in the preview right now — pending choice
  // wins over saved.
  const activePhoto = pending?.kind === 'photo' ? pending.url : pending ? null : avatarUrl;
  const activeStock = pending?.kind === 'stock' ? pending.color : pending ? null : stockColor;

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await usersApi.uploadAvatar(file);
      onChange({ kind: 'photo', url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 grid place-items-center shrink-0">
          {activePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activePhoto} alt="" className="h-full w-full object-cover" />
          ) : (
            <StockAvatar color={activeStock || APP_DEFAULT_AVATAR_COLOR} size={88} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-300">
            {activePhoto
              ? 'Custom photo'
              : activeStock
                ? 'Stock avatar'
                : 'Default avatar'}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pick a color, reuse a past photo, or upload a new one.
          </p>
        </div>
      </div>

      {/* Upload */}
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full text-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 rounded-lg px-3 py-2 text-zinc-100 transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
        >
          {uploading ? 'Uploading…' : '+ Upload from device'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onFileSelected}
        />
        {uploadError && (
          <p role="alert" className="text-xs text-coral-300 mt-1">
            {uploadError}
          </p>
        )}
      </div>

      {/* Stock swatches */}
      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Stock</div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {AVATAR_SWATCHES.map((sw) => {
            const selected = activeStock === sw.hex && !activePhoto;
            return (
              <button
                key={sw.hex}
                type="button"
                onClick={() => onChange({ kind: 'stock', color: sw.hex })}
                aria-label={`Stock avatar ${sw.label}`}
                aria-pressed={selected}
                className={`group relative h-14 w-full rounded-lg overflow-hidden bg-zinc-900 border transition focus:outline-none focus:ring-2 focus:ring-coral-400/50 ${
                  selected ? 'border-coral-400 ring-1 ring-coral-400/40' : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <span className="grid place-items-center h-full w-full">
                  <StockAvatar color={sw.hex} size={44} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent uploads */}
      {history.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Recent</div>
          <div className="grid grid-cols-6 gap-2">
            {history.map((url) => {
              const selected = activePhoto === url;
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => onChange({ kind: 'photo', url })}
                  aria-label="Reuse this photo"
                  aria-pressed={selected}
                  className={`relative h-14 w-full rounded-lg overflow-hidden bg-zinc-800 border transition focus:outline-none focus:ring-2 focus:ring-coral-400/50 ${
                    selected ? 'border-coral-400 ring-1 ring-coral-400/40' : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
