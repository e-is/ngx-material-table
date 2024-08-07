import { UntypedFormGroup } from '@angular/forms';

import { TableDataSource } from './table-data-source';

export abstract class TableElement<T> {
  id: number;
  originalData?: T;
  source: TableDataSource<T, any, any, TableElement<any>>;

  abstract get editing(): boolean;
  abstract set editing(editing: boolean);

  abstract get currentData(): T;
  abstract set currentData(currentData: T);
  abstract cloneData(): T;

  abstract get validator(): UntypedFormGroup;
  abstract set validator(validator: UntypedFormGroup);

  delete( options = { emitEvent: true }): boolean {
    return this.source.delete(this.id, options);
  }

  confirmEditCreate(options = { emitEvent: true }): boolean {
    return this.source.confirmEditCreate(this, options);
  }

  /**
   * Cancel or delete
   */
  cancelOrDelete(options = { emitEvent: true }): boolean {
    return this.source.cancelOrDelete(this, options);
  }

  cancel(): boolean {
    return this.source.cancel(this);
  }

  startEdit(): boolean {
    return this.source.startEdit(this);
  }

  move(direction: number): boolean {
    return this.source.move(this.id, direction);
  }

  abstract get valid(): boolean;

  abstract get pending(): boolean;

  abstract get invalid(): boolean;

  abstract get dirty(): boolean;

  /**
   * Check if the row is valid.
   */
  abstract isValid(): boolean;
}
