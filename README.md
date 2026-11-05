# Angular material table (Angular 10+)

**Forked from [angular4-material-table](https://github.com/irossimoline/angular4-material-table)**

This project extends `@angular/cdk` data-table, also used in `@angular/material` table.

It extends `@angular/cdk/collections` DataSource in order to include a row structure, allowing row creation, inline row edition, deletion and validation.

Supported angular versions: 
- Angular 21 (v21.x)
- Angular 20 (v20.x)
- Angular 18 (v18.x)
- Angular 17 (v17.x)
  - 17.3 (v17.3.x)
  - 17.2 (v17.2.x)
- Angular 16 (v0.16.0)
- Angular 15 (v0.15.0)
- Angular 14 (v0.14.0)
- Angular 11 (v0.11.0 and v0.12.0)
- Angular 10 (v0.10.0)
- Angular <= 9: Please use [angular4-material-table](https://github.com/irossimoline/angular4-material-table)

![@e-is/ngx-material-table](https://i.imgur.com/ufilXlv.gif)

## Installation

To install the package run:

`npm install @e-is/ngx-material-table`

## Example

Example of using `@e-is/ngx-material-table`:

![@e-is/ngx-material-table](https://i.imgur.com/vncajJG.png)

![Other example](https://i.imgur.com/5ed814s.png)


## Use

### Initial steps

To use this table, first of all you must check [how use angular `@angular/cdk` data-table](https://material.angular.io/guide/cdk-table).

### Useful data and methods

Using this extension, you can set CDK data-table `datasource` with an instance of `TableDataSource`.

Using `TableDataSource` allows you to have some row related methods and data to implement add/edit/remove elements:
```typescript
class TableElement<T> {
  id: number;
  editing: boolean;
  currentData?: T;
  originalData?: T;
  source: TableDataSource<T>;
  validator: FormGroup; // Used only in reactive forms.

  delete(): void;
  confirmEditCreate(): boolean;
  startEdit(): void;
  cancelOrDelete(): void;
  isValid(): boolean; // Used only in reactive forms.
}
```

```typescript
class TableDataSource<T> {

  constructor(
    data: T[],
    dataType?: new () => T,
    validatorService?: ValidatorService,
    config = { prependNewElements: false, suppressErrors: false });

  datasourceSubject: Subject<T[]>;

  updateDatasource(data: T[], options = { emitEvent: true }): void;

  createNew(): void;

  getRow(id: number): AsyncTableElement<T>;
}
```

### Angular4 material table example

Angular material table use example:
![Example of @e-is/ngx-material-table use](https://i.imgur.com/ath56FU.png)

[See this package in action](https://stackblitz.com/edit/angular-tj9f6y)

#### Optional libraries
Optional libraries used in the example:
```
"@angular/material": "^20.2.0",
"@angular/forms": "^20.3.0", // <- For inline validation
"material-design-icons": "^3.0.1"
```

#### person-list-reactive-forms.component.html


```html
<mat-table [dataSource]="dataSource">
  <ng-container matColumnDef="name">
    <mat-header-cell *matHeaderCellDef> Name </mat-header-cell>
    <mat-cell *matCellDef="let row">
      <mat-form-field [floatLabel]="row.editing ? 'auto' : 'never'">
        <input matInput [formControl]="row.validator.controls['name']" placeholder="Name">
      </mat-form-field>
    </mat-cell>
  </ng-container>
  <ng-container matColumnDef="age">
    <mat-header-cell *matHeaderCellDef> Age </mat-header-cell>
    <mat-cell *matCellDef="let row">
      <mat-form-field [floatLabel]="row.editing ? 'auto' : 'never'">
        <input matInput [formControl]="row.validator.controls['age']" type="number" placeholder="Age">
      </mat-form-field>
    </mat-cell>
  </ng-container>
  <ng-container matColumnDef="actionsColumn">
    <mat-header-cell *matHeaderCellDef>
      <button mat-icon-button color="accent" (click)="dataSource.createNew()"><i class="fa fa-plus mat-icon"></i></button>
    </mat-header-cell>
    <mat-cell *matCellDef="let row">
      <button *ngIf="!row.editing" mat-icon-button color="primary" (click)="row.startEdit()">
        <mat-icon>edit</mat-icon>
      </button>
      <button *ngIf="row.editing" mat-icon-button color="primary" (click)="row.confirmEditCreate()">
        <mat-icon>done</mat-icon>
      </button>
      <button mat-icon-button color="primary" (click)="row.cancelOrDelete()">
        <mat-icon *ngIf="row.editing">undo</mat-icon>
        <mat-icon *ngIf="!row.editing">delete</mat-icon>
      </button>
    </mat-cell>
  </ng-container>

  <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
  <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
</mat-table>
```

#### person-list-template-driven.component.html


```html
<mat-table [dataSource]="dataSource">
  <ng-container matColumnDef="name">
    <mat-header-cell *matHeaderCellDef> Name </mat-header-cell>
    <mat-cell *matCellDef="let row">
      <mat-form-field [floatLabel]="row.editing ? 'float' : 'never'">
        <input [(ngModel)]="row.currentData.name" placeholder="Name" [disabled]="!row.editing" matInput>
      </mat-form-field>
    </mat-cell>
  </ng-container>
  <ng-container matColumnDef="age">
    <mat-header-cell *matHeaderCellDef> Age </mat-header-cell>
    <mat-cell *matCellDef="let row">
      <mat-form-field [floatLabel]="row.editing ? 'float' : 'never'">
        <input type="number" [(ngModel)]="row.currentData.age" placeholder="Age"  [disabled]="!row.editing" matInput>
      </mat-form-field>
    </mat-cell>
  </ng-container>
  <ng-container matColumnDef="actionsColumn">
    <mat-header-cell *matHeaderCellDef>
      <button mat-icon-button color="accent" (click)="dataSource.createNew()"><i class="fa fa-plus mat-icon"></i></button>
    </mat-header-cell>
    <mat-cell *matCellDef="let row">
      <button *ngIf="!row.editing" mat-icon-button color="primary" (click)="row.startEdit()">
        <mat-icon>edit</mat-icon>
      </button>
      <button *ngIf="row.editing" mat-icon-button color="primary" (click)="row.confirmEditCreate()">
        <mat-icon>done</mat-icon>
      </button>
      <button mat-icon-button color="primary" (click)="row.cancelOrDelete()">
        <mat-icon *ngIf="row.editing">undo</mat-icon>
        <mat-icon *ngIf="!row.editing">delete</mat-icon>
      </button>
    </mat-cell>
  </ng-container>

  <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
  <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
</mat-table>
```

#### person-list.component.ts
```typescript
@Component({
  selector: 'app-person-list',
  providers: [
    {provide: ValidatorService, useClass: PersonValidatorService }
  ],
  templateUrl: './person-list.component.html',
})
export class PersonListComponent implements OnInit {

  constructor(private personValidator: ValidatorService) { }

  displayedColumns = ['name', 'age', 'actionsColumn'];

  @Input() personList;
  @Output() personListChange = new EventEmitter<Person[]>();

  dataSource: TableDataSource<Person>;


  ngOnInit() {
    this.dataSource = new TableDataSource<any>(this.personList, Person, this.personValidator);

    this.dataSource.datasourceSubject.subscribe(personList => this.personListChange.emit(personList));
  }
}

class Person {
  name: string;
  age: number;
}

@Injectable()
class PersonValidatorService implements ValidatorService {
  getRowValidator(): FormGroup {
    return new FormGroup({
      'name': new FormControl(null, Validators.required),
      'age': new FormControl(),
      });
  }
}

```

## Virtual scroll

Tables with a large number of rows can render only the visible window, with
`@angular/cdk/scrolling` (no third party package).

```typescript
// The datasource keeps every row: the table slices the rendered window
this.dataSource = new AsyncTableDataSource<Person>(persons, Person, this.personValidator, {
  virtualScroll: true,
});
```

```html
<cdk-virtual-scroll-viewport tableVirtualScroll>
  <mat-table [dataSource]="dataSource" [trackBy]="trackByFn">
    <!-- one matRowDef only -->
  </mat-table>
</cdk-virtual-scroll-viewport>
```

```typescript
// Stable identity: the row id of a table element is an index, and is renumbered
// on every insertion, deletion or move; the identity used here is the data id.
trackByFn = tableRowTrackBy;
```

`TableVirtualScrollDirective` (`tableVirtualScroll`) provides the fixed size scroll
strategy, and reads the row height at runtime from `--mat-row-height`, computed on the
viewport host:

```scss
.cdk-virtual-scroll-viewport {
  --mat-row-height: 34px;
}
```

API:

- `virtualScroll` (or `setVirtualScroll(value)`) on `TableDataSource` / `AsyncTableDataSource`:
  when `true`, `connect()` returns every known row and `CdkTable` is the only authority that
  slices the window. When `false` (default), the datasource slices the rows from the ranges sent
  by the collection viewer, as before. **Never slice in both places**: a viewport fed by a
  datasource that slices as well renders no row at all.
- `TableVirtualScrollDirective`: `itemSize` (read from `--mat-row-height`), viewport buffers
  (200/400 px) and the drift guard.
- `strictRowHeight` (input, default `false`): throw instead of warning on the first rendered row
  whose height diverges from `itemSize`.
- `readVirtualRowHeight(element, fallback?)`, `measureRenderedRowHeight(host)`,
  `isRowHeightDrifted(rowHeight, itemSize)`, `isRowIndexOutsideRange(index, range)`,
  `computeRowCollapsed(focusRowsEnabled, focused, virtualScroll)`, `tableRowTrackBy` /
  `createTableRowTrackBy(identity?)`, and the `DEFAULT_TABLE_ROW_HEIGHT` fallback.
- `IAsyncTableDataSource` also accepts the optional `totalRowCount` and `loading` members, for
  paginated sources.

### Fixed row height is a requirement

A virtual viewport maps a row index to an offset, so every rendered row must be exactly
`itemSize` high. Under a virtualised table, the following are **not supported**: collapsed rows
(`.mat-row-collapsed`), compact mode (`.compact`, `-small`), auto height (`-height-auto`), a
second `matRowDef` (detail row), a table nested in a row, and cell content that grows a row
(`mat-hint`, `mat-error`, several lines of text). `computeRowCollapsed()` returns `false` when the
table is virtualised, and the drift guard reports the first violation, once, in development.

`ScrollableTableDataSource` is kept as a **deprecated** alias of `AsyncTableDataSource` with
`virtualScroll` enabled. It no longer depends on `ng-table-virtual-scroll`, whose row stacking is
broken on Angular 21.

## Contributions

Any suggestion or contribution will be appreciated.


## Change log

See [Change log](./doc/changelog.md)


