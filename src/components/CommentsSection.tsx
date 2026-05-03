'use client';
import { useState } from 'react';
import { useMealComments } from '@/lib/hooks';
import { mascotFor, MASCOTS } from './Mascot';

interface Props {
  mealId: string;
}

const inputCls =
  'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent';

function timeAgo(iso: string): string {
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

export default function CommentsSection({ mealId }: Props) {
  const { comments, isLoading, addComment, deleteComment } = useMealComments(mealId);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addComment(draft.trim());
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Comments
        </h3>
        <span className="text-xs text-zinc-500">
          {comments.length === 0
            ? 'no notes yet'
            : `${comments.length} ${comments.length === 1 ? 'note' : 'notes'}`}
        </span>
      </div>

      {isLoading ? (
        <div className="text-zinc-500 text-sm italic">Loading…</div>
      ) : comments.length === 0 ? (
        <div className="text-zinc-500 text-sm italic border border-dashed border-zinc-800 rounded-lg p-3">
          Drop a note when you cook this — what worked, what flopped, what you'd swap next time.
        </div>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => {
            const mascot = MASCOTS[mascotFor(c.commentId)];
            return (
              <li
                key={c.commentId}
                className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 group"
              >
                <div className="flex items-start gap-2">
                  <span
                    className="h-7 w-7 rounded-full grid place-items-center text-sm flex-shrink-0 mt-0.5"
                    style={{
                      background: `${mascot.accent}22`,
                      border: `1px solid ${mascot.accent}66`,
                    }}
                    aria-hidden="true"
                  >
                    {mascot.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-500 mb-0.5">
                      <span className="text-zinc-300 font-semibold">{mascot.name}</span>
                      <span className="mx-1.5 text-zinc-700">·</span>
                      {timeAgo(c.createdAt)}
                    </div>
                    <div className="text-sm text-zinc-200 whitespace-pre-wrap break-words">
                      {c.body}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteComment(c.commentId)}
                    className="text-zinc-600 hover:text-coral-400 text-xs opacity-0 group-hover:opacity-100 transition"
                    aria-label="Delete comment"
                  >
                    delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2 pt-1">
        <textarea
          rows={2}
          maxLength={2000}
          placeholder="Add a note… (e.g. 'Subbed quinoa for rice, was great')"
          className={inputCls + ' resize-y'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        {error && (
          <div className="text-xs text-coral-300">{error}</div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-600">
            {draft.length}/2000
          </span>
          <button
            type="submit"
            disabled={submitting || !draft.trim()}
            className="text-xs font-semibold uppercase tracking-wider bg-coral-500 hover:bg-coral-400 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md transition"
          >
            {submitting ? 'Posting…' : 'Post note'}
          </button>
        </div>
      </form>
    </div>
  );
}
