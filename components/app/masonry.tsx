"use client";

import {
  Children,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MasonryProps {
  children: ReactNode;
  /** Number of columns per breakpoint (RTL-aware) */
  columns?: Partial<Record<"sm" | "md" | "lg" | "xl" | "2xl", number>>;
  /** Gap between items in px */
  gap?: number;
  /** Extra class names on the wrapper */
  className?: string;
}

// ─── Column config ────────────────────────────────────────────────────────────

const DEFAULT_COLUMNS = {
  sm: 2, // < 640
  md: 3, // 640–1023
  lg: 4, // 1024–1279
  xl: 5, // 1280–1535
  "2xl": 7, // ≥ 1536
} as const;

/** Resolves how many columns to use for the current container width */
function getColumnCount(
  width: number,
  columns: Partial<Record<string, number>>,
): number {
  const c = { ...DEFAULT_COLUMNS, ...columns };
  if (width < 640) return c.sm ?? 2;
  if (width < 1024) return c.md ?? 3;
  if (width < 1280) return c.lg ?? 4;
  if (width < 1536) return c.xl ?? 5;
  return c["2xl"] ?? 7;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns column-span of an item (reads data-span attribute) */
function getSpan(el: Element, maxCols: number): number {
  const raw = (el as HTMLElement).dataset.span;
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 1 : Math.min(n, maxCols);
}

// ─── Core layout engine ───────────────────────────────────────────────────────

/**
 * Computes absolute positions for each item.
 * The algorithm places items RTL (right → left), choosing the rightmost
 * available gap that fits the item's span.
 *
 * Returns an array of { top, left, width } for each child element.
 */
function computeLayout(
  container: HTMLElement,
  gap: number,
  colCount: number,
): Array<{ top: number; left: number; width: number }> {
  const totalWidth = container.clientWidth;
  const colWidth = (totalWidth - gap * (colCount - 1)) / colCount;

  // colHeights[i] = current filled height of column i (0 = rightmost in RTL)
  const colHeights = new Array<number>(colCount).fill(0);

  // Pre-compute X position of each column (RTL: col 0 is on the right)
  const colLeft = Array.from({ length: colCount }, (_, i) => {
    // col 0 → right edge, col (colCount-1) → left edge
    return (colCount - 1 - i) * (colWidth + gap);
  });

  const items = Array.from(container.children) as HTMLElement[];
  const positions: Array<{ top: number; left: number; width: number }> = [];

  for (const item of items) {
    const span = Math.min(getSpan(item, colCount), colCount);

    // Find the best starting column (rightmost) where span columns fit
    // and the max height of those columns is minimised.
    let bestCol = 0;
    let bestMaxH = Infinity;

    for (let c = 0; c <= colCount - span; c++) {
      const maxH = Math.max(...colHeights.slice(c, c + span));
      if (maxH < bestMaxH) {
        bestMaxH = maxH;
        bestCol = c;
      }
    }

    const itemTop = bestMaxH; // start just below the tallest in range
    const itemLeft = colLeft[bestCol + span - 1]; // leftmost pixel of span (RTL)
    const itemWidth = colWidth * span + gap * (span - 1);
    const itemHeight = item.offsetHeight;

    positions.push({ top: itemTop, left: itemLeft, width: itemWidth });

    // Update heights for occupied columns
    for (let c = bestCol; c < bestCol + span; c++) {
      colHeights[c] = itemTop + itemHeight + gap;
    }
  }

  // Set container height
  container.style.height = `${Math.max(...colHeights)}px`;

  return positions;
}

/** Applies computed positions to DOM elements */
function applyPositions(
  container: HTMLElement,
  positions: Array<{ top: number; left: number; width: number }>,
) {
  const items = Array.from(container.children) as HTMLElement[];
  items.forEach((item, i) => {
    const p = positions[i];
    if (!p) return;
    item.style.position = "absolute";
    item.style.top = `${p.top}px`;
    item.style.left = `${p.left}px`;
    item.style.width = `${p.width}px`;
    // Trigger CSS transition (only on items that are already laid out)
    if (!item.dataset.laid) {
      item.style.opacity = "0";
      item.style.transform = "translateY(8px)";
      // Force a reflow so the initial state registers
      void item.offsetHeight;
      item.style.opacity = "1";
      item.style.transform = "translateY(0)";
      item.dataset.laid = "1";
    }
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Masonry({
  children,
  columns = {},
  gap = 16,
  className = "",
}: MasonryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colCountRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // ── Layout runner ──────────────────────────────────────────────────────────

  const runLayout = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const cols = getColumnCount(el.clientWidth, columns);
    colCountRef.current = cols;

    const positions = computeLayout(el, gap, cols);
    applyPositions(el, positions);
  }, [columns, gap]);

  const scheduleLayout = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      runLayout();
    });
  }, [runLayout]);

  // ── Initial layout + resize ────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    scheduleLayout();

    const ro = new ResizeObserver(scheduleLayout);
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleLayout]);

  // ── Re-layout when children change (infinite scroll) ──────────────────────

  const childCount = Children.count(children);
  const prevCountRef = useRef(childCount);

  useEffect(() => {
    if (childCount !== prevCountRef.current) {
      prevCountRef.current = childCount;

      // Wait for new children to mount and have measurable heights
      // Two frames is enough: first renders DOM, second paints.
      requestAnimationFrame(() => requestAnimationFrame(scheduleLayout));
    }
  }, [childCount, scheduleLayout]);

  // ── Image-load triggers ────────────────────────────────────────────────────
  // Images that load after mount change item heights — relayout.

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onLoad = () => scheduleLayout();
    const imgs = el.querySelectorAll<HTMLImageElement>("img");
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", onLoad, { once: true });
    });

    return () => {
      imgs.forEach((img) => {
        img.removeEventListener("load", onLoad);
      });
    };
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const mo = new MutationObserver(() => {
      // هر بار DOM داخل container تغییر کرد (مثلاً Suspense resolve شد)
      requestAnimationFrame(() => requestAnimationFrame(scheduleLayout));
    });

    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [scheduleLayout]);

  // ── SSR Fallback styles ────────────────────────────────────────────────────
  // On the server and before hydration, we use CSS columns for a reasonable
  // initial render (no JS needed). The JS engine overrides this on mount.

  const ssrCols = { ...DEFAULT_COLUMNS, ...columns };
  const ssrStyle: CSSProperties = {
    columnCount: ssrCols["2xl"],
    columnGap: `${gap}px`,
    direction: "rtl",
  };

  return (
    <>
      {/* SSR / no-JS stylesheet */}
      <style>{`
        .masonry-ssr {
          position: relative;
          column-count: ${ssrCols.sm};
          column-gap: ${gap}px;
          direction: rtl;
        }
        @media (min-width: 640px) {
          .masonry-ssr { column-count: ${ssrCols.md}; }
        }
        @media (min-width: 1024px) {
          .masonry-ssr { column-count: ${ssrCols.lg}; }
        }
        @media (min-width: 1280px) {
          .masonry-ssr { column-count: ${ssrCols.xl}; }
        }
        @media (min-width: 1536px) {
          .masonry-ssr { column-count: ${ssrCols["2xl"]}; }
        }

        /* JS-active: switch to absolute positioning mode */
        .masonry-js {
          position: relative !important;
          column-count: unset !important;
        }
        .masonry-js > * {
          /* Transition for new items appearing */
          transition: opacity 0.25s ease, transform 0.25s ease;
          /* break-inside to prevent SSR column splits */
          break-inside: avoid;
        }
      `}</style>

      <div
        ref={containerRef}
        className={`masonry-ssr ${className}`}
        style={ssrStyle}
      >
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return child;
          return cloneElement(
            child as React.ReactElement<{ style?: CSSProperties }>,
            {
              style: {
                ...(child.props as { style?: CSSProperties }).style,
                // SSR: make each item a block inside CSS columns
                display: "block",
                marginBottom: `${gap}px`,
                breakInside: "avoid",
              },
            },
          );
        })}
      </div>
    </>
  );
}
