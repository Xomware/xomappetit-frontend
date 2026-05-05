'use client';
import { useState } from 'react';
import { recipesApi } from '@/lib/api';

interface Props {
  recipeId: string;
  initialCount?: number;
  initialLiked?: boolean;
  /** Compact card-footer style; default is the larger detail-page style. */
  compact?: boolean;
  onChange?: (state: { likeCount: number; likedByMe: boolean }) => void;
}

/**
 * Heart toggle for a recipe. Optimistic update flips the icon + count
 * on click, then reconciles with the server response. Failures roll
 * back and show a transient red border.
 */
export default function LikeButton({
  recipeId,
  initialCount = 0,
  initialLiked = false,
  compact = false,
  onChange,
}: Props) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    // Optimistic flip
    const nextLiked = !liked;
    const nextCount = Math.max(0, count + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setCount(nextCount);
    setError(false);
    setPending(true);

    try {
      const res = await recipesApi.like(recipeId);
      setCount(res.likeCount);
      setLiked(res.likedByMe);
      onChange?.({ likeCount: res.likeCount, likedByMe: res.likedByMe });
    } catch {
      // Roll back
      setLiked(liked);
      setCount(count);
      setError(true);
    } finally {
      setPending(false);
    }
  };

  const sizeCls = compact ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';
  const heart = liked ? '♥' : '♡';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike recipe' : 'Like recipe'}
      className={`inline-flex items-center gap-1 rounded-md border transition focus:outline-none focus:ring-2 focus:ring-coral-400/40 ${sizeCls} ${
        liked
          ? 'bg-coral-500/15 text-coral-300 border-coral-500/30 hover:bg-coral-500/20'
          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-coral-500/30 hover:text-coral-300'
      } ${error ? 'border-red-500/60' : ''} ${pending ? 'opacity-70' : ''}`}
    >
      <span aria-hidden="true" className={liked ? 'text-coral-300' : ''}>
        {heart}
      </span>
      <span className="font-semibold">{count}</span>
    </button>
  );
}
