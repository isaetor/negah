"use client";

import {
  Children,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MasonryProps {
  children: ReactNode;
  /**
   * تعداد ستون‌ها در هر breakpoint.
   * پیش‌فرض: sm=2, md=3, lg=5, xl=6, 2xl=7
   */
  columns?: Partial<Record<"sm" | "md" | "lg" | "xl" | "2xl", number>>;
  /** فاصله بین آیتم‌ها به پیکسل */
  gap?: number;
  /** کلاس‌های اضافی روی wrapper */
  className?: string;
}

// ─── Column config ────────────────────────────────────────────────────────────

const DEFAULT_COLUMNS = {
  sm: 2, // < 640px
  md: 3, // 640–1023px
  lg: 5, // 1024–1279px
  xl: 6, // 1280–1535px
  "2xl": 7, // ≥ 1536px
} as const;

type ColumnsMap = Partial<Record<string, number>>;

function getColumnCount(width: number, columns: ColumnsMap): number {
  const c = { ...DEFAULT_COLUMNS, ...columns };
  if (width < 640) return c.sm ?? 2;
  if (width < 1024) return c.md ?? 3;
  if (width < 1280) return c.lg ?? 5;
  if (width < 1536) return c.xl ?? 6;
  return c["2xl"] ?? 7;
}

// ─── Shared layout algorithm ──────────────────────────────────────────────────
// این تابع هم در SSR (بدون DOM) و هم در client استفاده می‌شود.
// در SSR ارتفاع از data-ssr-height می‌آید.
// در client از offsetHeight المان می‌آید.

interface LayoutItem {
  span: number;
  height: number;
}

interface Position {
  top: number;
  left: number;
  width: number;
}

function computePositions(
  items: LayoutItem[],
  containerWidth: number,
  gap: number,
  colCount: number,
): { positions: Position[]; totalHeight: number } {
  const colWidth = (containerWidth - gap * (colCount - 1)) / colCount;
  const colHeights = new Array<number>(colCount).fill(0);

  // RTL: ستون 0 = راست‌ترین، ستون (colCount-1) = چپ‌ترین
  const colLeft = Array.from(
    { length: colCount },
    (_, i) => (colCount - 1 - i) * (colWidth + gap),
  );

  const positions: Position[] = [];

  for (const item of items) {
    const span = Math.min(item.span, colCount);

    // بهترین ستون = جایی که حداکثر ارتفاع ستون‌های پوشش‌داده‌شده کمینه باشد
    let bestCol = 0;
    let bestMaxH = Infinity;

    for (let c = 0; c <= colCount - span; c++) {
      const maxH = Math.max(...colHeights.slice(c, c + span));
      if (maxH < bestMaxH) {
        bestMaxH = maxH;
        bestCol = c;
      }
    }

    const itemTop = bestMaxH;
    // در RTL: چپ‌ترین پیکسل span = ستون (bestCol + span - 1)
    const itemLeft = colLeft[bestCol + span - 1];
    const itemWidth = colWidth * span + gap * (span - 1);

    positions.push({ top: itemTop, left: itemLeft, width: itemWidth });

    for (let c = bestCol; c < bestCol + span; c++) {
      colHeights[c] = itemTop + item.height + gap;
    }
  }

  return {
    positions,
    totalHeight: Math.max(...colHeights),
  };
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function getSpanFromEl(el: HTMLElement, maxCols: number): number {
  const raw = el.dataset.span;
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 1 : Math.min(n, maxCols);
}

// ─── Client layout (با DOM) ───────────────────────────────────────────────────

function runClientLayout(
  container: HTMLElement,
  gap: number,
  columns: ColumnsMap,
): void {
  const colCount = getColumnCount(container.clientWidth, columns);
  const els = Array.from(container.children) as HTMLElement[];

  const items: LayoutItem[] = els.map((el) => ({
    span: getSpanFromEl(el, colCount),
    height: el.offsetHeight,
  }));

  const { positions, totalHeight } = computePositions(
    items,
    container.clientWidth,
    gap,
    colCount,
  );

  container.style.height = `${totalHeight}px`;

  els.forEach((el, i) => {
    const p = positions[i];
    if (!p) return;

    el.style.position = "absolute";
    el.style.top = `${p.top}px`;
    el.style.left = `${p.left}px`;
    el.style.width = `${p.width}px`;

    // انیمیشن فقط برای آیتم‌های تازه که هنوز laid نشده‌اند
    if (!el.dataset.laid) {
      el.style.opacity = "0";
      el.style.transform = "translateY(10px)";
      void el.offsetHeight; // force reflow
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      el.dataset.laid = "1";
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
  const rafRef = useRef<number | null>(null);

  // ── scheduleLayout ────────────────────────────────────────────────────────

  const scheduleLayout = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const mergedCols = { ...DEFAULT_COLUMNS, ...columns };

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = containerRef.current;
      if (el) runClientLayout(el, gap, mergedCols);
    });
  }, [gap, columns]);

  // ── 1. اولین layout + resize روی container ───────────────────────────────

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

  // ── 2. تغییر تعداد children (infinite scroll) ────────────────────────────

  const childCount = Children.count(children);
  const prevCountRef = useRef(childCount);

  useEffect(() => {
    if (childCount === prevCountRef.current) return;
    prevCountRef.current = childCount;
    // دو فریم صبر می‌کنیم تا DOM جدید mount و paint شود
    requestAnimationFrame(() => requestAnimationFrame(scheduleLayout));
  }, [childCount, scheduleLayout]);

  // ── 3. تغییر ارتفاع هر آیتم ─────────────────────────────────────────────
  //
  // ResizeObserver روی هر child مستقیم container:
  // وقتی محتوای یک آیتم expand/collapse می‌شود (مثلاً accordion، لود تصویر،
  // تغییر متن)، ارتفاع آن تغییر می‌کند و کل layout بازمحاسبه می‌شود.

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const itemRO = new ResizeObserver((entries) => {
      // فقط اگر ارتفاع (block size) واقعاً تغییر کرده relayout کن
      const changed = entries.some(
        (e) => (e.borderBoxSize?.[0]?.blockSize ?? 0) > 0,
      );
      if (changed) scheduleLayout();
    });

    const observeChildren = () => {
      itemRO.disconnect();
      Array.from(el.children).forEach((child) => {
        itemRO.observe(child);
      });
    };

    observeChildren();

    // وقتی child جدید اضافه شد (Suspense resolve یا infinite scroll)
    // observer را به‌روز کن
    const mo = new MutationObserver(() => {
      observeChildren();
      requestAnimationFrame(() => requestAnimationFrame(scheduleLayout));
    });

    mo.observe(el, { childList: true, subtree: false });

    return () => {
      itemRO.disconnect();
      mo.disconnect();
    };
  }, [scheduleLayout]);

  // ── 4. تصاویری که بعد از mount لود می‌شوند ──────────────────────────────
  // (redundant با ResizeObserver اما برای مرورگرهایی که دیر fire می‌کنند)

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

  const childArray = Children.toArray(children).filter(
    isValidElement,
  ) as ReactElement<Record<string, unknown>>[];

  return (
    <div
      ref={containerRef}
      className={`relative *:transition-all *:duration-200 *:ease-in grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 ${className}`}
    >
      {childArray.map((child, i) => {
        const existingStyle = (child.props.style ?? {}) as CSSProperties;

        return cloneElement(child, {
          key: child.key ?? i,
          style: {
            ...existingStyle,
          } satisfies CSSProperties,
        });
      })}
    </div>
  );
}
