import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { TableDataSource } from '../table-data-source';
import { tableRowTrackBy } from './table-virtual-scroll.utils';
import { TableVirtualScrollDirective } from './table-virtual-scroll.directive';

class Item {
  id: number;
  name: string;

  constructor(id?: number, name?: string) {
    this.id = id;
    this.name = name;
  }
}

function createItems(count: number): Item[] {
  return Array.from({ length: count }).map((_, index) => new Item(index + 1, `item ${index + 1}`));
}

const ROW_SELECTOR = 'mat-row, tr[mat-row]';

/** Number of rendered rows: the double selector catches both the div and the native form. */
function countRenderedRows(fixture: ComponentFixture<unknown>): number {
  return fixture.nativeElement.querySelectorAll(ROW_SELECTOR).length;
}

/** Height of the scrollable content: rows count x itemSize, set by the scroll strategy. */
function renderedContentSize(fixture: ComponentFixture<unknown>): number {
  const spacer = fixture.nativeElement.querySelector('.cdk-virtual-scroll-spacer') as HTMLElement;
  return spacer ? spacer.offsetHeight : -1;
}

/** The invariant of a virtualised table: a window is rendered, not the whole dataset. */
function expectVirtualisedWindow(renderedRows: number): void {
  if (renderedRows < 1) {
    throw new Error('No row is rendered: the window is empty (the datasource is probably slicing it as well)');
  }
  if (renderedRows >= 60) {
    throw new Error(`${renderedRows} rows are rendered: the table is not virtualised`);
  }
}

async function settle(fixture: ComponentFixture<unknown>, predicate?: () => boolean, timeoutMs = 3000): Promise<void> {
  const start = Date.now();
  do {
    fixture.detectChanges();
    // Let the viewport compute its window, then the table render it
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (predicate && predicate()) return;
  } while (Date.now() - start < timeoutMs);
}

@Component({
  standalone: true,
  imports: [MatTableModule, ScrollingModule, TableVirtualScrollDirective],
  template: `
    <cdk-virtual-scroll-viewport tableVirtualScroll class="viewport" [strictRowHeight]="strict">
      <mat-table [dataSource]="dataSource" [trackBy]="trackBy">
        <ng-container matColumnDef="id">
          <mat-header-cell *matHeaderCellDef>#</mat-header-cell>
          <mat-cell class="cell" *matCellDef="let row">
            {{ row.id }}
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="columns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: columns" [class.tall]="tall"></mat-row>
      </mat-table>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [
    `
      .viewport {
        --mat-row-height: 34px;
        width: 400px;
        height: 400px;
      }

      .mat-mdc-header-row,
      .mat-mdc-row {
        height: 34px;
        min-height: 34px;
        max-height: 34px;
      }

      .mat-mdc-row.tall {
        height: 50px;
        min-height: 50px;
        max-height: 50px;
      }

      .cell {
        overflow: hidden;
      }
    `,
  ],
})
class VirtualScrollHostComponent {
  @ViewChild(CdkVirtualScrollViewport, { static: true }) viewport: CdkVirtualScrollViewport;
  @ViewChild(TableVirtualScrollDirective, { static: true }) directive: TableVirtualScrollDirective;

  columns = ['id'];
  trackBy = tableRowTrackBy;
  strict = false;
  tall = false;
  dataSource: TableDataSource<Item>;

  setRows(count: number, virtual: boolean): void {
    this.dataSource = new TableDataSource<Item>(createItems(count), Item, undefined, { virtualScroll: virtual });
  }
}

/** Same table, without any viewport: the non-virtualised reference. */
@Component({
  standalone: true,
  imports: [MatTableModule],
  template: `
    <div class="table">
      <mat-table [dataSource]="dataSource" [trackBy]="trackBy">
        <ng-container matColumnDef="id">
          <mat-header-cell *matHeaderCellDef>#</mat-header-cell>
          <mat-cell class="cell" *matCellDef="let row">
            {{ row.id }}
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="columns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: columns"></mat-row>
      </mat-table>
    </div>
  `,
  styles: [
    `
      .table {
        width: 400px;
        height: 400px;
      }

      .mat-mdc-header-row,
      .mat-mdc-row {
        height: 34px;
        min-height: 34px;
        max-height: 34px;
      }

      .cell {
        overflow: hidden;
      }
    `,
  ],
})
class PlainTableHostComponent {
  columns = ['id'];
  trackBy = tableRowTrackBy;
  dataSource: TableDataSource<Item>;

  setRows(count: number): void {
    this.dataSource = new TableDataSource<Item>(createItems(count), Item);
  }
}

async function createFixture<T>(type: new () => T): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({ imports: [type as any] }).compileComponents();
  return TestBed.createComponent(type);
}

async function createVirtualScrollFixture(
  rows: number,
  virtual: boolean,
  options: { strict?: boolean; tall?: boolean; settleMs?: number } = {}
): Promise<ComponentFixture<VirtualScrollHostComponent>> {
  const fixture = await createFixture(VirtualScrollHostComponent);
  const component = fixture.componentInstance;
  component.strict = options.strict === true;
  component.tall = options.tall === true;
  component.setRows(rows, virtual);

  fixture.detectChanges();
  await settle(fixture, undefined, options.settleMs ?? 3000);

  return fixture;
}

async function createPlainTableFixture(rows: number): Promise<ComponentFixture<PlainTableHostComponent>> {
  const fixture = await createFixture(PlainTableHostComponent);
  fixture.componentInstance.setRows(rows);

  fixture.detectChanges();
  await settle(fixture);

  return fixture;
}

describe('TableVirtualScrollDirective', () => {
  it('reads the row height from the computed --mat-row-height', async () => {
    const fixture = await createVirtualScrollFixture(10, true);
    expect(fixture.componentInstance.directive.itemSize).toBe(34);
  });

  it('puts the row height into the scroll strategy, so scrolling maps an index to an offset', async () => {
    const fixture = await createVirtualScrollFixture(1000, true);

    expect(fixture.componentInstance.viewport.getDataLength()).toBe(1000);
    expect(renderedContentSize(fixture)).toBe(1000 * 34);
  });

  it('renders a window of rows, not the whole dataset', async () => {
    const fixture = await createVirtualScrollFixture(1000, true);

    await settle(fixture, () => countRenderedRows(fixture) > 0);
    const rendered = countRenderedRows(fixture);

    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(60);
    expect(() => expectVirtualisedWindow(rendered)).not.toThrow();
  });

  it('renders rows again after a scroll to the middle of the dataset', async () => {
    const fixture = await createVirtualScrollFixture(1000, true);
    const viewport = fixture.componentInstance.viewport;
    await settle(fixture, () => countRenderedRows(fixture) > 0);

    viewport.scrollToIndex(500);
    await settle(fixture, () => viewport.getRenderedRange().start > 0);

    const range = viewport.getRenderedRange();
    expect(range.start).toBeGreaterThanOrEqual(480);
    expect(range.start).toBeLessThanOrEqual(540);
    expect(range.end).toBeGreaterThan(range.start);
    expect(countRenderedRows(fixture)).toBeGreaterThan(0);
  });

  it('renders an empty table without failing', async () => {
    const fixture = await createVirtualScrollFixture(0, true);
    await settle(fixture, () => fixture.componentInstance.viewport.getDataLength() === 0);

    expect(countRenderedRows(fixture)).toBe(0);
  });

  it('keeps a window when rows are appended to the dataset', async () => {
    const fixture = await createVirtualScrollFixture(1000, true);
    const component = fixture.componentInstance;
    await settle(fixture, () => countRenderedRows(fixture) > 0);

    component.dataSource.updateDatasource(createItems(1010));
    await settle(fixture, () => component.viewport.getDataLength() === 1010);

    expect(countRenderedRows(fixture)).toBeGreaterThan(0);
    expect(countRenderedRows(fixture)).toBeLessThan(60);
  });

  describe('red runs - the proof that the assertions detect a broken window', () => {
    it('RED 1: without a viewport, the whole dataset is rendered and the window assertion fails', async () => {
      const fixture = await createPlainTableFixture(1000);
      await settle(fixture, () => countRenderedRows(fixture) >= 1000);

      const rendered = countRenderedRows(fixture);

      expect(rendered).toBe(1000);
      expect(() => expectVirtualisedWindow(rendered)).toThrow();
    });

    it('RED 2: with a datasource that slices as well, nothing is rendered and the window assertion fails', async () => {
      const fixture = await createVirtualScrollFixture(1000, false, { settleMs: 800 });

      const rendered = countRenderedRows(fixture);

      expect(rendered).toBe(0);
      expect(() => expectVirtualisedWindow(rendered)).toThrow();
    });
  });

  describe('drift guard', () => {
    it('warns once when a rendered row height diverges from the itemSize', async () => {
      const fixture = await createVirtualScrollFixture(1000, true, { tall: true });
      await settle(fixture, () => countRenderedRows(fixture) > 0);

      const warn = spyOn(console, 'warn');
      fixture.componentInstance.directive.checkRowHeightDrift();
      fixture.componentInstance.directive.checkRowHeightDrift();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.calls.mostRecent().args[0]).toContain('--mat-row-height is 34px');
    });

    it('throws in strict mode, so that the fixed height contract is a test invariant', async () => {
      const fixture = await createVirtualScrollFixture(1000, true, { strict: true, tall: true });
      await settle(fixture, () => countRenderedRows(fixture) > 0);

      expect(() => fixture.componentInstance.directive.checkRowHeightDrift()).toThrow();
    });

    it('accepts rows matching the itemSize', async () => {
      const fixture = await createVirtualScrollFixture(1000, true, { strict: true });
      await settle(fixture, () => countRenderedRows(fixture) > 0);

      expect(() => fixture.componentInstance.directive.checkRowHeightDrift()).not.toThrow();
    });
  });
});
