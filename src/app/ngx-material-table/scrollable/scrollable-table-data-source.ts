import { ValidatorService } from '../validator.service';
import { TableDataSourceConfig } from '../table-data-source';
import { AsyncTableElement } from '../async/async-table-element';
import { AsyncTableDataSource } from '../async/async-table-data-source';

/**
 * @deprecated Use `AsyncTableDataSource` with `virtualScroll = true`, and put
 * `tableVirtualScroll` on a `cdk-virtual-scroll-viewport`.
 *
 * Kept as a thin alias so that existing code keeps compiling: it used to extend
 * `TableVirtualScrollDataSource` from `ng-table-virtual-scroll`, a package that patched
 * Angular internals and no longer stacks its rows on Angular 21. The windowing is now
 * handled by `@angular/cdk/scrolling` and by the table itself.
 */
export class ScrollableTableDataSource<
  T,
  V extends ValidatorService = ValidatorService,
  C extends TableDataSourceConfig = TableDataSourceConfig,
  R extends AsyncTableElement<T> = AsyncTableElement<T>,
> extends AsyncTableDataSource<T, V, C, R> {
  constructor(data: T[], dataType?: new () => T, validatorService?: V, config?: C) {
    super(data, dataType, validatorService, { virtualScroll: true, ...config } as C);
  }
}
