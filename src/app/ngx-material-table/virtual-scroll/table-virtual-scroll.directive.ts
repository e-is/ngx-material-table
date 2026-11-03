import { VIRTUAL_SCROLL_STRATEGY, CdkVirtualScrollViewport, FixedSizeVirtualScrollStrategy, VirtualScrollStrategy } from '@angular/cdk/scrolling';
import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  DEFAULT_TABLE_ROW_HEIGHT,
  ROW_HEIGHT_TOLERANCE_PX,
  TABLE_ROW_SELECTOR,
  VIRTUAL_SCROLL_MAX_BUFFER_PX,
  VIRTUAL_SCROLL_MIN_BUFFER_PX,
  readVirtualRowHeight,
} from './table-virtual-scroll.utils';

/**
 * `VirtualScrollStrategy` reading its `itemSize` at runtime.
 *
 * `cdk-virtual-scroll-viewport` builds its strategy while the element is still detached from
 * the document, so a strategy built from a plain `itemSize` input cannot read
 * `--mat-row-height`. The fixed size strategy is therefore created on `attach()`, when the
 * viewport is in the DOM, and the row height is read from the computed style at that moment.
 */
export class TableVirtualScrollStrategy implements VirtualScrollStrategy {
  private readonly viewportChanges = new Subject<void>();
  private fixedStrategy: FixedSizeVirtualScrollStrategy | null = null;
  private resolvedItemSize: number | null = null;

  readonly scrolledIndexChange: Observable<number> = this.viewportChanges.pipe(
    switchMap(() => this.strategy.scrolledIndexChange)
  );

  constructor(
    private readonly host: HTMLElement,
    private readonly fallbackItemSize = DEFAULT_TABLE_ROW_HEIGHT,
    private readonly minBufferPx = VIRTUAL_SCROLL_MIN_BUFFER_PX,
    private readonly maxBufferPx = VIRTUAL_SCROLL_MAX_BUFFER_PX
  ) {}

  /** Row height used by the viewport offsets. */
  get itemSize(): number {
    return this.resolveItemSize();
  }

  attach(viewport: CdkVirtualScrollViewport): void {
    this.strategy.attach(viewport);
    this.viewportChanges.next();
  }

  detach(): void {
    this.fixedStrategy?.detach();
  }

  onContentScrolled(): void {
    this.strategy.onContentScrolled();
  }

  onDataLengthChanged(): void {
    this.strategy.onDataLengthChanged();
  }

  onContentRendered(): void {
    this.strategy.onContentRendered();
  }

  onRenderedOffsetChanged(): void {
    this.strategy.onRenderedOffsetChanged();
  }

  scrollToIndex(index: number, behavior: ScrollBehavior): void {
    this.strategy.scrollToIndex(index, behavior);
  }

  private get strategy(): FixedSizeVirtualScrollStrategy {
    if (!this.fixedStrategy) {
      this.fixedStrategy = new FixedSizeVirtualScrollStrategy(this.resolveItemSize(), this.minBufferPx, this.maxBufferPx);
    }
    return this.fixedStrategy;
  }

  private resolveItemSize(): number {
    if (this.resolvedItemSize == null) {
      this.resolvedItemSize = readVirtualRowHeight(this.host, this.fallbackItemSize);
    }
    return this.resolvedItemSize;
  }
}

/**
 * Enables the virtualised mode of `cdk-virtual-scroll-viewport`, for a table whose
 * datasource has `virtualScroll` set.
 *
 * It provides the scroll strategy (fixed row height, read from `--mat-row-height` at
 * runtime), sets the viewport buffers, and guards the fixed height contract: any rendered
 * row whose height diverges from the `itemSize` means that the table contains a content
 * that a virtual viewport cannot align (collapsed row, compact mode, auto height, hints or
 * errors growing a cell) and is reported once in development, or thrown in strict mode.
 *
 * Usage: `<cdk-virtual-scroll-viewport tableVirtualScroll>` — do not also set `itemSize`,
 * which would install a second strategy.
 */
@Directive({
  selector: 'cdk-virtual-scroll-viewport[tableVirtualScroll]',
  standalone: true,
  host: { class: 'table-viewport' },
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: () =>
        new TableVirtualScrollStrategy(
          inject(ElementRef).nativeElement as HTMLElement,
          DEFAULT_TABLE_ROW_HEIGHT,
          VIRTUAL_SCROLL_MIN_BUFFER_PX,
          VIRTUAL_SCROLL_MAX_BUFFER_PX
        ),
    },
  ],
})
export class TableVirtualScrollDirective implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly viewport = inject(CdkVirtualScrollViewport, { optional: true });
  private subscription: Subscription | null = null;
  private warned = false;

  /**
   * Turn the fixed height contract into a testable invariant: instead of warning, throw on
   * the first rendered row whose height diverges from the `itemSize`.
   */
  @Input() strictRowHeight = false;

  /** Row height the viewport is using, read from `--mat-row-height` when the viewport attaches. */
  get itemSize(): number {
    return readVirtualRowHeight(this.host);
  }

  ngOnInit(): void {
    if (!this.viewport) {
      throw new Error('tableVirtualScroll must be applied on a cdk-virtual-scroll-viewport');
    }

    // The rendered window only settles after the viewport has rendered its first rows.
    this.subscription = this.viewport.renderedRangeStream.subscribe(() => this.scheduleDriftCheck());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  /** Check every rendered row against the `itemSize`. Exposed for tests and for consumers. */
  checkRowHeightDrift(): void {
    const itemSize = this.itemSize;
    const rows = Array.from(this.host.querySelectorAll<HTMLElement>(TABLE_ROW_SELECTOR));

    const drifted = rows.find((row) => row.offsetHeight > 0 && Math.abs(row.offsetHeight - itemSize) > ROW_HEIGHT_TOLERANCE_PX);
    if (!drifted) return;

    const message =
      `Table virtual scroll: a rendered row is ${drifted.offsetHeight}px high, ` +
      `while --mat-row-height is ${itemSize}px. A virtualised table requires a fixed row height: ` +
      `collapsed rows, compact mode, auto height and hints or errors growing a cell are not supported.`;

    if (this.strictRowHeight) {
      throw new Error(message);
    }
    if (this.warned) return;

    this.warned = true;
    console.warn(message);
  }

  private scheduleDriftCheck(): void {
    const check = () => this.checkRowHeightDrift();

    // Row heights are only measurable once the browser has laid the new window out.
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => setTimeout(check, 0));
    } else {
      setTimeout(check, 0);
    }
  }
}
