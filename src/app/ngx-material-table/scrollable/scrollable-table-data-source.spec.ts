import { CollectionViewer, ListRange } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { AsyncTableDataSource } from '../async/async-table-data-source';
import { AsyncTableElement } from '../async/async-table-element';
import { ScrollableTableDataSource } from './scrollable-table-data-source';

class Item {
  id: number;

  constructor(id?: number) {
    this.id = id;
  }
}

function createItems(count: number): Item[] {
  return Array.from({ length: count }).map((_, index) => new Item(index + 1));
}

function createViewer(): { viewer: CollectionViewer; viewChange: Subject<ListRange> } {
  const viewChange = new Subject<ListRange>();
  return { viewer: { viewChange }, viewChange };
}

type Rows = AsyncTableElement<Item>[] | ReadonlyArray<AsyncTableElement<Item>>;

describe('ScrollableTableDataSource (deprecated alias)', () => {
  it('is an AsyncTableDataSource, with the virtualised mode enabled', () => {
    const source = new ScrollableTableDataSource<Item>(createItems(10), Item);

    expect(source instanceof AsyncTableDataSource).toBeTrue();
    expect(source.virtualScroll).toBeTrue();
  });

  it('returns the complete flow, without slicing the window itself', () => {
    const source = new ScrollableTableDataSource<Item>(createItems(1000), Item);
    const viewer = createViewer();
    const emissions: Rows[] = [];
    source.connect(viewer.viewer).subscribe((rows) => emissions.push(rows));
    viewer.viewChange.next({ start: 10, end: 20 });
    source.rowsSubject.next(source.rowsSubject.getValue());

    expect(emissions[emissions.length - 1].length).toBe(1000);
  });

  it('lets an explicit config override the virtualised mode', () => {
    const source = new ScrollableTableDataSource<Item>(createItems(10), Item, undefined, { virtualScroll: false });
    expect(source.virtualScroll).toBeFalse();
  });
});
