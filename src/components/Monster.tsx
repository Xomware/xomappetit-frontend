'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Ambient blobs + occasional lightning, tinted in the Xom Appétit palette
 * (coral / flame). Ported from xomware-frontend's MonsterComponent so all
 * apps share the same vibe.
 *
 * Lives behind content (z-0, pointer-events: none). Honors
 * prefers-reduced-motion: places blobs statically, no lightning.
 */
const NUM_BLOBS = 6;
const SCALES = [80, 100, 120, 65, 90, 75];
const BRAND_COLORS = [
  '#ff6b6b', // coral-400
  '#ff9598', // coral-300
  '#f04444', // coral-500
  '#ff7b1c', // flame-500
  '#ffa94d', // flame-400
];
const START_POS: [number, number][] = [
  [300, 200], [900, 400], [1500, 300], [600, 700], [1200, 600], [200, 900],
];

export default function Monster() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    // Captured non-nullable for inner closures — TS doesn't narrow refs
    // through nested function scopes.
    const svg: SVGSVGElement = svgEl;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lightningTimer: ReturnType<typeof setTimeout> | null = null;

    const blob = (i: number) => svg.querySelector<SVGGElement>(`.blob-${i}`);

    function initBlobs() {
      for (let i = 0; i < NUM_BLOBS; i++) {
        const el = blob(i);
        if (!el) continue;
        gsap.set(el, {
          x: START_POS[i][0],
          y: START_POS[i][1],
          scale: SCALES[i] / 18,
        });
      }
    }

    function placeStatic() {
      for (let i = 0; i < NUM_BLOBS; i++) {
        const body = blob(i)?.querySelector('.b-body');
        if (!body) continue;
        gsap.set(body, { attr: { fill: BRAND_COLORS[i % BRAND_COLORS.length] } });
      }
    }

    function wanderBlob(index: number) {
      const el = blob(index);
      if (!el) return;
      gsap.to(el, {
        x: 100 + Math.random() * 1720,
        y: 50 + Math.random() * 980,
        duration: 8 + Math.random() * 7,
        ease: 'sine.inOut',
        onComplete: () => wanderBlob(index),
      });
    }

    function breatheBlob(index: number) {
      const body = blob(index)?.querySelector('.b-body');
      if (!body) return;
      gsap.to(body, {
        attr: { ry: 18 },
        duration: 3 + Math.random() * 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 2,
      });
    }

    function cycleColor(index: number) {
      const body = blob(index)?.querySelector('.b-body');
      if (!body) return;
      const startIdx = index % BRAND_COLORS.length;
      const colors = [
        ...BRAND_COLORS.slice(startIdx),
        ...BRAND_COLORS.slice(0, startIdx),
      ];
      const tl = gsap.timeline({ repeat: -1, delay: index * 5 });
      colors.forEach((color) => {
        tl.to(body, {
          attr: { fill: color },
          duration: 30 + Math.random() * 30,
          ease: 'sine.inOut',
        });
      });
    }

    function generateBoltPath(startX: number, startY: number, length: number): string {
      let x = startX;
      let y = startY;
      const segs: string[] = [`M${x},${y}`];
      const n = 6 + Math.floor(Math.random() * 8);
      const segLen = length / n;
      for (let i = 0; i < n; i++) {
        x += (Math.random() - 0.5) * segLen * 1.5;
        y += segLen * (0.6 + Math.random() * 0.6);
        x = Math.max(50, Math.min(1870, x));
        y = Math.min(1050, y);
        segs.push(`L${Math.round(x)},${Math.round(y)}`);
      }
      return segs.join(' ');
    }

    function strikeLightning() {
      const layer = svg.querySelector('.lightning-layer');
      if (!layer) return;
      const ns = 'http://www.w3.org/2000/svg';
      const startX = 100 + Math.random() * 1720;
      const startY = Math.random() * 200;
      const path = generateBoltPath(startX, startY, 600 + Math.random() * 900);
      // Weight toward coral primary; occasional flame burst.
      const color = Math.random() > 0.3
        ? BRAND_COLORS[0]
        : BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];

      const bolt = document.createElementNS(ns, 'path');
      bolt.setAttribute('d', path);
      bolt.setAttribute('fill', 'none');
      bolt.setAttribute('stroke', color);
      bolt.setAttribute('stroke-width', '4.5');
      bolt.setAttribute('stroke-linecap', 'round');
      bolt.setAttribute('filter', 'url(#lightningGlow)');
      bolt.setAttribute('opacity', '0');
      layer.appendChild(bolt);

      let branch: SVGPathElement | null = null;
      if (Math.random() > 0.5) {
        const segments = path.split(' L');
        if (segments.length > 3) {
          const idx = Math.floor(segments.length * 0.3) + Math.floor(Math.random() * (segments.length * 0.4));
          const coords = segments[idx]?.replace('M', '').trim().split(',');
          if (coords && coords.length === 2) {
            const bx = parseFloat(coords[0]);
            const by = parseFloat(coords[1]);
            const branchPath = generateBoltPath(bx, by, 80 + Math.random() * 150);
            branch = document.createElementNS(ns, 'path');
            branch.setAttribute('d', branchPath);
            branch.setAttribute('fill', 'none');
            branch.setAttribute('stroke', color);
            branch.setAttribute('stroke-width', '3');
            branch.setAttribute('stroke-linecap', 'round');
            branch.setAttribute('filter', 'url(#lightningGlow)');
            branch.setAttribute('opacity', '0');
            layer.appendChild(branch);
          }
        }
      }

      const elements: SVGPathElement[] = branch ? [bolt, branch] : [bolt];
      const tl = gsap.timeline({
        onComplete: () => elements.forEach((el) => el.remove()),
      });
      tl.to(elements, {
        attr: { opacity: 0.7 + Math.random() * 0.3 },
        duration: 0.05,
        ease: 'power4.in',
      })
        .to(elements, { attr: { opacity: 0 }, duration: 0.08 })
        .to(elements, {
          attr: { opacity: 0.4 + Math.random() * 0.4 },
          duration: 0.03,
          delay: 0.05 + Math.random() * 0.1,
        })
        .to(elements, {
          attr: { opacity: 0 },
          duration: 0.15 + Math.random() * 0.2,
          ease: 'power2.out',
        });
    }

    function scheduleLightning() {
      const delay = 1500 + Math.random() * 4000; // 1.5-5.5s — sparser than xomware
      lightningTimer = setTimeout(() => {
        strikeLightning();
        scheduleLightning();
      }, delay);
    }

    initBlobs();
    if (reducedMotion) {
      placeStatic();
    } else {
      for (let i = 0; i < NUM_BLOBS; i++) {
        wanderBlob(i);
        breatheBlob(i);
        cycleColor(i);
      }
      scheduleLightning();
    }

    return () => {
      if (lightningTimer) clearTimeout(lightningTimer);
      gsap.killTweensOf(svg.querySelectorAll('.blob, .b-body, path'));
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-screen h-screen pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1920 1080"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          <radialGradient id="blobShine" cx="35%" cy="30%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <filter id="blobBlur">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="lightningGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="lightning-layer" />

        {Array.from({ length: NUM_BLOBS }).map((_, i) => (
          <g key={i} className={`blob blob-${i}`} filter="url(#blobBlur)">
            <ellipse rx={18} ry={16} fill="#ff6b6b" opacity={0.1} className="b-body" />
            <ellipse cx={-5} cy={-6} rx={7} ry={4} fill="url(#blobShine)" />
          </g>
        ))}
      </svg>
    </div>
  );
}
