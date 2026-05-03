'use client';

/**
 * Three-mascot roster for Xom Appétit. Real illustrations land later;
 * for now each mascot has a tag, accent color, and a quick caption used
 * for empty states and toasts.
 */
export type MascotKey = 'boyardee' | 'ramsay' | 'fieri';

export interface MascotProfile {
  key: MascotKey;
  name: string;
  caption: string;
  emoji: string;
  accent: string;
}

export const MASCOTS: Record<MascotKey, MascotProfile> = {
  boyardee: {
    key: 'boyardee',
    name: 'Xom Boyardee',
    caption: "What's cookin'?",
    emoji: '👨‍🍳',
    accent: 'var(--color-coral-400)',
  },
  ramsay: {
    key: 'ramsay',
    name: 'Xomdon Ramsay',
    caption: "It's RAW.",
    emoji: '😤',
    accent: 'var(--color-flame-500)',
  },
  fieri: {
    key: 'fieri',
    name: 'Xom Fieri',
    caption: 'Welcome to Flavortown.',
    emoji: '🔥',
    accent: '#ffd166',
  },
};

interface Props {
  mascot: MascotKey;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE = {
  sm: { box: 'h-8 w-8 text-base', label: 'text-xs' },
  md: { box: 'h-12 w-12 text-2xl', label: 'text-sm' },
  lg: { box: 'h-20 w-20 text-4xl', label: 'text-base' },
};

export default function Mascot({ mascot, size = 'md' }: Props) {
  const profile = MASCOTS[mascot];
  const s = SIZE[size];
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${s.box} rounded-full grid place-items-center bg-zinc-900 border-2`}
        style={{ borderColor: profile.accent }}
        aria-hidden="true"
      >
        <span>{profile.emoji}</span>
      </div>
      <div className={s.label}>
        <div className="font-semibold leading-tight">{profile.name}</div>
        <div className="text-zinc-400 leading-tight">{profile.caption}</div>
      </div>
    </div>
  );
}

/** Pick a mascot for a given context. Stable per (key) so the same meal
 * always shows the same mascot until we wire user preference. */
export function mascotFor(seed: string): MascotKey {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const keys: MascotKey[] = ['boyardee', 'ramsay', 'fieri'];
  return keys[Math.abs(h) % keys.length];
}
