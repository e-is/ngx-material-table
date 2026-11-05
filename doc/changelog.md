## 21.0.2-alpha.1
- [enh] Add a generic virtual scroll mode to `TableDataSource` and `AsyncTableDataSource`:
  `virtualScroll` returns the complete flow, `CdkTable` is the only slicing authority
- [enh] Add `TableVirtualScrollDirective` (`tableVirtualScroll`) on `cdk-virtual-scroll-viewport`:
  fixed size strategy with `itemSize` read from `--mat-row-height`, viewport buffers, and a
  drift guard (warning in development, throwing in strict mode)
- [enh] Add `tableRowTrackBy` / `createTableRowTrackBy`, `readVirtualRowHeight`,
  `measureRenderedRowHeight`, `isRowHeightDrifted`, `isRowIndexOutsideRange`,
  `computeRowCollapsed` and `DEFAULT_TABLE_ROW_HEIGHT`
- [enh] Add the optional `totalRowCount` and `loading` members to `IAsyncTableDataSource`
- [enh] Export the virtual scroll API and the deprecated `ScrollableTableDataSource` from `public_api`
- [refactor] `ScrollableTableDataSource` becomes a deprecated alias of `AsyncTableDataSource`;
  remove the `ng-table-virtual-scroll` dependency
- [enh] Add the package `peerDependencies`, and a Karma test setup for the library

## 0.17.0
- [enh] Support Angular 17

## 0.16.0
- [enh] Support Angular 16

## 0.14.4
- [fix] TableDataSource: when opts.editing is undefined, apply the default value

## 0.14.5

- [fix] Fix row id update, when move/insert prepend rows
- [enh] Add `TableDatasource.addMany(array[], insertAt)` to insert many rows
- [enh] Add `TableDatasource.hasNewElement`: boolean to known if there is a new+editing row
- [enh] Add examples, using nav tabs
- [enh] Add `ScrollableTableDataSource` to use CDK virtual scrolling (experimental - not yet exposed)

## 17.0.0
- [enh] Migrate to Angular 17.1

## 17.2.0
- [enh] Migrate to Angular 17.2 

## 17.2.1
- [enh] Add options argument to `row.delete()`, `row.confirmEditCreate()` and `row.cancelOrDelete()`
- [fix] Scrollable : remove duplicated class AsyncTableElement

Inconsistent version (DO NOT USED)

## 17.2.2
- Fix dependency error 

## 17.3.0
- [enh] Migrate to Angular 17.3 

## 18.0.0
- [enh] Migrate to Angular 18 

## 18.0.2
- [fix] `DataSource.createNew()` should always use the value of `insertAt` when equals to 0 (replace `if (insertAt) { /*...*/ }` with `if (insertAt >= 0) { /*...*/ }`) 

## 18.0.3
- [fix] Fix error when calling `DataSource.addMany()` with `insertAt=null`  

## 21.0.1
- [enh] Upgrade to Angular 21
