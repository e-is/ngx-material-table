import { CollectionViewer, ListRange } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { TableDataSource } from './table-data-source';
import { TableElement } from './table-element';
import { tableRowTrackBy } from './virtual-scroll/table-virtual-scroll.utils';

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

interface TestViewer {
  viewer: CollectionViewer;
  viewChange: Subject<ListRange>;
}

function createViewer(): TestViewer {
  const viewChange = new Subject<ListRange>();
  return { viewer: { viewChange }, viewChange };
}

type Rows = readonly TableElement<Item>[];

/** Connect the datasource and collect its emissions, as `CdkTable` consumes them. */
function connect(source: TableDataSource<Item>, viewer: TestViewer): Rows[] {
  const emissions: Rows[] = [];
  source.connect(viewer.viewer).subscribe((rows) => emissions.push(rows));
  return emissions;
}

/** Push a window, then the rows: this is the order a legacy (non virtualised) table uses. */
function emitWindow(source: TableDataSource<Item>, viewer: TestViewer, range: ListRange): void {
  viewer.viewChange.next(range);
  source.rowsSubject.next(source.rowsSubject.getValue());
}

function last(emissions: Rows[]): Rows {
  return emissions[emissions.length - 1];
}

describe('TableDataSource - legacy slicing', () => {
  it('slices the rows from the range sent by the collection viewer', () => {
    const source = new TableDataSource<Item>(createItems(4), Item);
    const viewer = createViewer();

    const emissions = connect(source, viewer);
    emitWindow(source, viewer, { start: 0, end: 2 });

    expect(last(emissions).length).toBe(2);
    expect(last(emissions)[0].currentData.id).toBe(1);
  });

  it('slices from the window start, up to the window end', () => {
    const source = new TableDataSource<Item>(createItems(10), Item);
    const viewer = createViewer();

    const emissions = connect(source, viewer);
    emitWindow(source, viewer, { start: 4, end: 6 });

    expect(last(emissions).length).toBe(2);
    expect(last(emissions)[0].currentData.id).toBe(5);
    expect(last(emissions)[1].currentData.id).toBe(6);
  });

  it('returns every row when the window covers them all', () => {
    const source = new TableDataSource<Item>(createItems(3), Item);
    const viewer = createViewer();

    const emissions = connect(source, viewer);
    emitWindow(source, viewer, { start: 0, end: 3 });

    expect(last(emissions).length).toBe(3);
  });

  it('returns an empty window on an empty list', () => {
    const source = new TableDataSource<Item>([], Item);
    const viewer = createViewer();

    const emissions = connect(source, viewer);
    emitWindow(source, viewer, { start: 0, end: 10 });

    expect(last(emissions)).toEqual([]);
  });

  it('slices the new window after the list size changed', () => {
    const source = new TableDataSource<Item>(createItems(3), Item);
    const viewer = createViewer();
    const emissions = connect(source, viewer);

    viewer.viewChange.next({ start: 3, end: 8 });
    source.updateDatasource(createItems(10));

    expect(last(emissions).length).toBe(5);
    expect(last(emissions)[0].currentData.id).toBe(4);
  });
});

describe('TableDataSource - virtualised mode', () => {
  it('is disabled by default', () => {
    const source = new TableDataSource<Item>(createItems(4), Item);
    expect(source.virtualScroll).toBeFalse();
  });

  it('can be enabled from the config', () => {
    const source = new TableDataSource<Item>(createItems(4), Item, undefined, { virtualScroll: true });
    expect(source.virtualScroll).toBeTrue();
  });

  it('can be enabled after construction, before connecting', () => {
    const source = new TableDataSource<Item>(createItems(4), Item);
    source.setVirtualScroll(true);
    expect(source.virtualScroll).toBeTrue();
  });

  it('returns the complete flow, and never slices the window itself', () => {
    const source = new TableDataSource<Item>(createItems(1000), Item);
    source.virtualScroll = true;
    const viewer = createViewer();

    const emissions = connect(source, viewer);
    emitWindow(source, viewer, { start: 10, end: 20 });

    expect(last(emissions).length).toBe(1000);
    expect(last(emissions)[0].currentData.id).toBe(1);
    expect(last(emissions)[999].currentData.id).toBe(1000);
  });

  it('still returns the complete flow after the window moved', () => {
    const source = new TableDataSource<Item>(createItems(1000), Item);
    source.virtualScroll = true;
    const viewer = createViewer();
    const emissions = connect(source, viewer);
    emitWindow(source, viewer, { start: 0, end: 20 });

    emitWindow(source, viewer, { start: 500, end: 520 });

    expect(last(emissions).length).toBe(1000);
  });

  it('returns the complete flow when the list size changes', () => {
    const source = new TableDataSource<Item>(createItems(3), Item);
    source.virtualScroll = true;
    const viewer = createViewer();
    const emissions = connect(source, viewer);

    source.updateDatasource(createItems(10));

    expect(last(emissions).length).toBe(10);
  });

  it('returns an empty flow on an empty list', () => {
    const source = new TableDataSource<Item>([], Item);
    source.virtualScroll = true;
    const viewer = createViewer();

    const emissions = connect(source, viewer);
    emitWindow(source, viewer, { start: 0, end: 10 });

    expect(last(emissions)).toEqual([]);
  });

  it('does not subscribe to the viewer, since the table owns the window', () => {
    const source = new TableDataSource<Item>(createItems(4), Item);
    source.virtualScroll = true;
    const viewer = createViewer();

    source.connect(viewer.viewer).subscribe();

    expect(viewer.viewChange.observed).toBeFalse();
  });
});

describe('TableDataSource - row identity', () => {
  it('keeps the identity of the rendered rows when a row is deleted', () => {
    const source = new TableDataSource<Item>(createItems(3), Item);
    const identityBefore = source.rowsSubject.getValue().map((row) => tableRowTrackBy(0, row));

    source.delete(0);

    const rowsAfter = source.rowsSubject.getValue();
    const identityAfter = rowsAfter.map((row) => tableRowTrackBy(0, row));

    // Row ids are renumbered by the datasource, the data identities are not
    expect(rowsAfter[0].id).toBe(0);
    expect(identityAfter).toEqual(identityBefore.slice(1));
  });

  it('keeps the identity of the rendered rows when a row is inserted at the top', () => {
    const source = new TableDataSource<Item>(createItems(3), Item);
    const identityBefore = source.rowsSubject.getValue().map((row) => tableRowTrackBy(0, row));

    source.addMany([new Item(99, 'new')], 0);

    const identityAfter = source.rowsSubject.getValue().map((row) => tableRowTrackBy(0, row));

    identityBefore.forEach((identity) => expect(identityAfter).toContain(identity));
  });

  it('never gives the identity of another row to a new row', async () => {
    const source = new TableDataSource<Item>(createItems(2), Item);

    const newRow = await source.createNew();
    const identities = source.rowsSubject.getValue().map((row) => tableRowTrackBy(0, row));

    expect(new Set(identities).size).toBe(identities.length);
    expect(tableRowTrackBy(0, newRow)).toBe(newRow);
  });
});
