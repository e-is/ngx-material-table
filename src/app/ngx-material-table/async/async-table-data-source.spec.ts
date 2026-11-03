import { CollectionViewer, ListRange } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { AsyncTableDataSource, IAsyncTableDataSource } from './async-table-data-source';
import { AsyncTableElement } from './async-table-element';

class Item {
  id: number;
  name: string;

  constructor(id?: number, name?: string) {
    this.id = id;
    this.name = name;
  }
}

function createItems(from: number, count: number): Item[] {
  return Array.from({ length: count }).map((_, index) => new Item(from + index, `item ${from + index}`));
}

interface TestViewer {
  viewer: CollectionViewer;
  viewChange: Subject<ListRange>;
}

function createViewer(): TestViewer {
  const viewChange = new Subject<ListRange>();
  return { viewer: { viewChange }, viewChange };
}

type Rows = readonly AsyncTableElement<Item>[];

function connect(source: AsyncTableDataSource<Item>, viewer: TestViewer): Rows[] {
  const emissions: Rows[] = [];
  source.connect(viewer.viewer).subscribe((rows) => emissions.push(rows));
  return emissions;
}

function last(emissions: Rows[]): Rows {
  return emissions[emissions.length - 1];
}

describe('AsyncTableDataSource - legacy slicing', () => {
  it('slices the rows from the range sent by the collection viewer', () => {
    const source = new AsyncTableDataSource<Item>(createItems(1, 10), Item);
    const viewer = createViewer();
    const emissions = connect(source, viewer);

    viewer.viewChange.next({ start: 2, end: 5 });
    source.rowsSubject.next(source.rowsSubject.getValue());

    expect(last(emissions).length).toBe(3);
    expect(last(emissions)[0].currentData.id).toBe(3);
  });

  it('returns an empty window on an empty list', () => {
    const source = new AsyncTableDataSource<Item>([], Item);
    const viewer = createViewer();
    const emissions = connect(source, viewer);

    viewer.viewChange.next({ start: 0, end: 10 });
    source.rowsSubject.next(source.rowsSubject.getValue());

    expect(last(emissions)).toEqual([]);
  });
});

describe('AsyncTableDataSource - virtualised mode', () => {
  it('is disabled by default', () => {
    const source = new AsyncTableDataSource<Item>(createItems(1, 4), Item);
    expect(source.virtualScroll).toBeFalse();
  });

  it('can be enabled from the config, and from the setter', () => {
    const fromConfig = new AsyncTableDataSource<Item>(createItems(1, 4), Item, undefined, { virtualScroll: true });
    expect(fromConfig.virtualScroll).toBeTrue();

    const fromSetter = new AsyncTableDataSource<Item>(createItems(1, 4), Item);
    fromSetter.setVirtualScroll(true);
    expect(fromSetter.virtualScroll).toBeTrue();
  });

  it('returns the complete flow, never a window', () => {
    const source = new AsyncTableDataSource<Item>(createItems(1, 1000), Item);
    source.virtualScroll = true;
    const viewer = createViewer();
    const emissions = connect(source, viewer);

    viewer.viewChange.next({ start: 10, end: 20 });
    source.rowsSubject.next(source.rowsSubject.getValue());

    expect(last(emissions).length).toBe(1000);
  });

  it('returns every row received from an asynchronous source, page after page', () => {
    const source = new AsyncTableDataSource<Item>(createItems(1, 100), Item);
    source.virtualScroll = true;
    const viewer = createViewer();
    const emissions = connect(source, viewer);

    // Pages of a paginated source, arriving after the table connected
    source.updateDatasource(createItems(1, 200));
    source.updateDatasource(createItems(1, 300));

    expect(last(emissions).length).toBe(300);
    expect(last(emissions)[299].currentData.id).toBe(300);
  });

  it('returns every row after rows were appended without replacing the known ones', () => {
    const source = new AsyncTableDataSource<Item>(createItems(1, 10), Item);
    source.virtualScroll = true;
    const viewer = createViewer();
    const emissions = connect(source, viewer);

    source.addMany(createItems(11, 5));

    expect(last(emissions).length).toBe(15);
  });

  it('does not subscribe to the viewer, since the table owns the window', () => {
    const source = new AsyncTableDataSource<Item>(createItems(1, 4), Item);
    source.virtualScroll = true;
    const viewer = createViewer();

    source.connect(viewer.viewer).subscribe();

    expect(viewer.viewChange.observed).toBeFalse();
  });

  it('exposes the optional pagination state of the contract', () => {
    const source: IAsyncTableDataSource<Item, AsyncTableElement<Item>> = new AsyncTableDataSource<Item>(createItems(1, 10), Item);

    expect(source.totalRowCount).toBeUndefined();
    expect(source.loading).toBeUndefined();

    source.totalRowCount = 1250;
    source.loading = true;

    expect(source.totalRowCount).toBe(1250);
    expect(source.loading).toBeTrue();
    expect(source.virtualScroll).toBeFalse();
  });
});
