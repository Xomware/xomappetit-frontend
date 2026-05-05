'use client';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/hooks';
import { useUsersById, userLabel } from '@/lib/use-users-by-id';
import type { Notification } from '@/lib/api';
import Loader from '@/components/Loader';

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { items, unreadCount, isLoading, markRead, markAllRead } = useNotifications();
  const { map: users } = useUsersById(items.map((n) => n.actorUserId));
  const dataReady = isAuthenticated && !isLoading;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-black uppercase tracking-wide">
            Notifications
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {unreadCount > 0 ? (
              <>
                <span className="text-coral-400 font-semibold">{unreadCount}</span> unread
              </>
            ) : (
              'all caught up'
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead()}
            className="text-sm text-zinc-400 hover:text-coral-300 underline-offset-2 hover:underline transition"
          >
            Mark all read
          </button>
        )}
      </div>

      {!dataReady || authLoading ? (
        <Loader caption="loading…" />
      ) : items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <div className="text-5xl mb-3">🔔</div>
          <p className="text-zinc-400 text-sm">
            Nothing yet. Like a recipe or send a friend request to make some noise.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <NotificationRow
              key={n.sortKey}
              notif={n}
              actor={users.get(n.actorUserId)}
              onMarkRead={() => markRead(n.sortKey)}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

function NotificationRow({
  notif,
  actor,
  onMarkRead,
}: {
  notif: Notification;
  actor: ReturnType<typeof useUsersById>['map'] extends Map<string, infer V> ? V | undefined : never;
  onMarkRead: () => void;
}) {
  const actorName = userLabel(actor);
  const actorHandle = actor?.preferredUsername;
  const recipeName = notif.meta?.recipeName;
  const time = relativeTime(notif.createdAt);

  let body: React.ReactNode = null;
  let href: string = '#';

  switch (notif.type) {
    case 'friend_request':
      body = <><strong>{actorName}</strong> sent you a friend request</>;
      href = '/friends';
      break;
    case 'friend_accept':
      body = <><strong>{actorName}</strong> accepted your friend request</>;
      href = actorHandle ? `/u/view?handle=${encodeURIComponent(actorHandle)}` : '/friends';
      break;
    case 'recipe_liked':
      body = (
        <>
          <strong>{actorName}</strong> liked your recipe
          {recipeName && <> <span className="text-coral-300">{recipeName}</span></>}
        </>
      );
      href = `/recipes/view?id=${encodeURIComponent(notif.refId)}`;
      break;
    case 'comment_added':
      body = (
        <>
          <strong>{actorName}</strong> commented on{' '}
          {notif.refType === 'recipe' ? 'your recipe' : 'a cook'}
          {recipeName && <> <span className="text-coral-300">{recipeName}</span></>}
        </>
      );
      href =
        notif.refType === 'recipe'
          ? `/recipes/view?id=${encodeURIComponent(notif.refId)}`
          : `/cooks/view?id=${encodeURIComponent(notif.refId)}`;
      break;
    default:
      body = <>Something happened</>;
  }

  const initial = (actorName || '?').charAt(0).toUpperCase();
  const avatarUrl = actor?.avatarUrl ?? null;

  return (
    <li
      className={`flex items-start gap-3 rounded-lg p-3 border transition ${
        notif.read
          ? 'bg-zinc-900/40 border-zinc-800'
          : 'bg-zinc-900/80 border-coral-500/30'
      }`}
    >
      <div className="h-9 w-9 rounded-full overflow-hidden bg-zinc-800 grid place-items-center shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="h-full w-full grid place-items-center bg-gradient-to-br from-coral-500 to-flame-500 text-white font-black text-sm">
            {initial}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Link href={href} onClick={() => !notif.read && onMarkRead()} className="block">
          <p className="text-sm text-zinc-200">{body}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{time}</p>
        </Link>
      </div>
      {!notif.read && (
        <button
          type="button"
          onClick={onMarkRead}
          aria-label="Mark as read"
          className="text-[11px] text-zinc-500 hover:text-coral-300 transition shrink-0"
        >
          Mark read
        </button>
      )}
    </li>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
