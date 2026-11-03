import { ListRange } from '@angular/cdk/collections';

/** CSS custom property holding the fixed row height of a table, at runtime. */
export const TABLE_ROW_HEIGHT_CSS_VAR = '--mat-row-height';

/** Fallback row height, used when `--mat-row-height` cannot be resolved. */
export const DEFAULT_TABLE_ROW_HEIGHT = 34;

/** Divergence, in pixels, tolerated between a rendered row and the `itemSize`. */
export const ROW_HEIGHT_TOLERANCE_PX = 1;

/** Rows rendered around the visible window, so a fast scroll never shows a blank area. */
export const VIRTUAL_SCROLL_MIN_BUFFER_PX = 200;

/** Rows rendered ahead of the window, before the viewport asks for more. */
export const VIRTUAL_SCROLL_MAX_BUFFER_PX = 400;

/** Selector matching a rendered table row, for both the div and the native table forms. */
export const TABLE_ROW_SELECTOR = 'mat-row, tr[mat-row]';

export interface TableRowLike<T = any> {
  id?: number | string | null;
  currentData?: T | null;
}

/**
 * Parse a CSS length expressed in pixels. Returns null for anything else, so that
 * an unset (`''`) or non-pixel (`'calc(...)'`) value falls back instead of polluting
 * the virtual scroll offsets.
 */
export function parseCssPixelValue(value: string | null | undefined): number | null {
  if (value == null) return null;
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*px\s*$/.exec(value);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Read the row height at runtime from `--mat-row-height`, computed on the given element.
 * The variable is expected to be inherited by the table container, so it is read on the
 * viewport host rather than on `:root`: the same variable can be defined more than once
 * in an application, and only the computed value on the table is meaningful.
 */
export function readVirtualRowHeight(element?: Element | null, fallback = DEFAULT_TABLE_ROW_HEIGHT): number {
  const target = element ?? (typeof document === 'undefined' ? null : document.documentElement);
  if (!target || typeof getComputedStyle !== 'function') return fallback;

  const value = parseCssPixelValue(getComputedStyle(target).getPropertyValue(TABLE_ROW_HEIGHT_CSS_VAR));
  return value != null && value > 0 ? value : fallback;
}

/**
 * Measure the height of the first rendered row of a table host.
 * Used by the drift guard, and by consumers that need the real height rather than
 * the declared one (`--mat-row-max-height` can shrink a row below `--mat-row-height`).
 */
export function measureRenderedRowHeight(host: Element | null | undefined): number | null {
  const row = host?.querySelector(TABLE_ROW_SELECTOR) as HTMLElement | null;
  if (!row) return null;

  const height = row.offsetHeight;
  return height > 0 ? height : null;
}

/** True when a rendered row height diverges from the `itemSize` by more than the tolerance. */
export function isRowHeightDrifted(rowHeight: number, itemSize: number, tolerance = ROW_HEIGHT_TOLERANCE_PX): boolean {
  if (!rowHeight || !itemSize) return false;
  return Math.abs(rowHeight - itemSize) > tolerance;
}

/**
 * True when a row index is outside the rendered window. `range.end` is exclusive, as in
 * `@angular/cdk` `ListRange`: `{start: 10, end: 20}` contains the indexes 10 to 19.
 */
export function isRowIndexOutsideRange(index: number, range: ListRange | null | undefined): boolean {
  if (!range) return false;
  return index < range.start || index >= range.end;
}

/**
 * Collapsed rows (3 px, focus mode) break the index to offset mapping of a virtual
 * viewport: they are never collapsed when the table is virtualised.
 */
export function computeRowCollapsed(focusRowsEnabled: boolean, focused: boolean, virtualScroll: boolean): boolean {
  return !virtualScroll && focusRowsEnabled && focused;
}

/**
 * Build a `trackBy` function whose keys are stable across row insertion and deletion.
 *
 * The row id of a table element is an index: it is renumbered on every insertion,
 * deletion or move, so it cannot identify a rendered view. The identity used here is the
 * id of the underlying data when it exists (a persisted entity id, never renumbered), and
 * the row instance itself otherwise (new row, `id === -1`, unsaved data). A recycled view
 * therefore never carries the content of another row.
 *
 * @param identity Optional accessor, for data whose stable key is not `currentData.id`.
 */
export function createTableRowTrackBy<T extends TableRowLike<any>>(
  identity?: (row: T) => unknown
): (index: number, row: T) => unknown {
  return (index: number, row: T): unknown => {
    if (!row) return index;

    const key = identity ? identity(row) : (row.currentData as TableRowLike)?.id;
    if (key != null && key !== -1) return key;

    return row;
  };
}

/** Default stable `trackBy` for table rows: see `createTableRowTrackBy`. */
export const tableRowTrackBy = createTableRowTrackBy<TableRowLike>();
