'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/use-profile';
import EditProfileModal from '@/components/EditProfileModal';
import { UserProfile } from '@/lib/users';
import Loader from '@/components/Loader';

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { profile, isLoading, error, edit, uploadAvatar } = useProfile();
  const [editOpen, setEditOpen] = useState(false);

  if (authLoading || !isAuthenticated) {
    return <ProfileLoading />;
  }

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (error || !profile) {
    return <ProfileError message={error?.message ?? 'Profile unavailable'} />;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wide">
        Profile
      </h1>
      <ProfileCard
        profile={profile}
        onEdit={() => setEditOpen(true)}
        onUploadAvatar={uploadAvatar}
      />
      <StatsGrid />
      <EditProfileModal
        open={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
        onSave={edit}
      />
    </main>
  );
}

interface ProfileCardProps {
  profile: UserProfile;
  onEdit: () => void;
  onUploadAvatar: (file: File) => Promise<UserProfile>;
}

function ProfileCard({ profile, onEdit, onUploadAvatar }: ProfileCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur p-6 sm:p-8 brand-stamp">
      <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
        <AvatarBlock profile={profile} onUploadAvatar={onUploadAvatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
              @{profile.preferredUsername}
            </h2>
            <VisibilityBadge visibility={profile.profileVisibility} />
          </div>
          <p className="text-zinc-300 text-base sm:text-lg mt-1 truncate">
            {profile.displayName}
          </p>
          <p className="text-zinc-500 text-sm mt-1 truncate">{profile.email}</p>
          <button
            type="button"
            onClick={onEdit}
            className="mt-4 inline-flex bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white font-bold uppercase tracking-wider px-4 py-2 rounded-lg text-sm transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
          >
            Edit profile
          </button>
        </div>
      </div>
    </section>
  );
}

function AvatarBlock({
  profile,
  onUploadAvatar,
}: {
  profile: UserProfile;
  onUploadAvatar: (file: File) => Promise<UserProfile>;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      await onUploadAvatar(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative shrink-0">
      <label
        className="group relative block h-28 w-28 rounded-full overflow-hidden border-2 border-zinc-700 hover:border-coral-400 transition cursor-pointer focus-within:ring-2 focus-within:ring-coral-400/50"
        aria-label="Change avatar"
      >
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="h-full w-full grid place-items-center text-3xl font-black uppercase text-white bg-gradient-to-br from-coral-500 to-flame-500"
            aria-hidden="true"
          >
            {profile.preferredUsername.charAt(0)}
          </span>
        )}
        <span
          aria-hidden="true"
          className={`absolute inset-0 grid place-items-center bg-black/60 text-xs font-bold uppercase tracking-wider text-white transition ${
            uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {uploading ? 'Uploading…' : 'Change'}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handlePick(file);
            e.target.value = '';
          }}
        />
      </label>
      {error && (
        <p
          role="alert"
          className="absolute left-0 right-0 -bottom-6 text-[11px] text-coral-300 text-center"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function VisibilityBadge({ visibility }: { visibility: 'public' | 'private' }) {
  const isPublic = visibility === 'public';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
        isPublic
          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
      }`}
    >
      {isPublic ? 'Public' : 'Private'}
    </span>
  );
}

function StatsGrid() {
  // v1: zeros-only placeholders. Real values land when recipes/friends ship.
  const stats: { label: string; value: string }[] = [
    { label: 'Recipes added', value: '0' },
    { label: 'Recipes made', value: '0' },
    { label: 'Avg rating', value: '–' },
    { label: 'Friends', value: '0' },
  ];

  return (
    <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center"
        >
          <div className="font-display text-3xl font-black text-coral-300 tracking-tight">
            {s.value}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 mt-1">
            {s.label}
          </div>
        </div>
      ))}
    </section>
  );
}

function ProfileLoading() {
  return <Loader fullscreen caption="plating the profile…" />;
}

function ProfileError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-coral-400 text-3xl" aria-hidden="true">
          🍳
        </div>
        <h1 className="font-display text-2xl font-black uppercase tracking-wide mt-3">
          Couldn’t load profile
        </h1>
        <p className="text-zinc-400 text-sm mt-2">{message}</p>
        <Link
          href="/"
          className="mt-5 inline-block bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 text-zinc-100 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Back to recipes
        </Link>
      </div>
    </div>
  );
}
