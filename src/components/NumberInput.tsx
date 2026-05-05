'use client';
import { useEffect, useState, FocusEvent, InputHTMLAttributes } from 'react';

type Base = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>;

interface Props extends Base {
  value: number | null;
  onChange: (next: number | null) => void;
  /** Allow decimal points. Default false (integer-only). */
  decimal?: boolean;
  min?: number;
  max?: number;
}

/**
 * Number input that's actually pleasant on mobile.
 *
 * - Local string state so backspacing the existing value doesn't snap to 0
 * - select-all on focus so tap-and-type replaces the field
 * - inputMode=numeric / decimal so the right keyboard shows up
 * - Commits to parent on blur (parses + clamps)
 * - When parent value changes externally (e.g., auto-calc filled it),
 *   the field syncs via useEffect
 */
export default function NumberInput({
  value,
  onChange,
  decimal = false,
  min,
  max,
  onBlur,
  className,
  ...rest
}: Props) {
  const [draft, setDraft] = useState(value === null || value === undefined ? '' : String(value));

  useEffect(() => {
    setDraft(value === null || value === undefined ? '' : String(value));
  }, [value]);

  const commit = (e: FocusEvent<HTMLInputElement>) => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      onChange(null);
    } else {
      const n = decimal ? parseFloat(trimmed) : parseInt(trimmed, 10);
      if (!Number.isFinite(n)) {
        // Bad input — revert to the last good parent value.
        setDraft(value === null || value === undefined ? '' : String(value));
      } else {
        let clamped = n;
        if (min !== undefined && clamped < min) clamped = min;
        if (max !== undefined && clamped > max) clamped = max;
        onChange(clamped);
        setDraft(String(clamped));
      }
    }
    onBlur?.(e);
  };

  const allowedRe = decimal ? /^\d*\.?\d*$/ : /^\d*$/;

  return (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      pattern={decimal ? '[0-9]*[.]?[0-9]*' : '[0-9]*'}
      value={draft}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const v = e.currentTarget.value;
        if (allowedRe.test(v)) setDraft(v);
      }}
      onBlur={commit}
      className={className}
      {...rest}
    />
  );
}
