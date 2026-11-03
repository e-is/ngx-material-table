import { ValidatorService } from '../ngx-material-table/validator.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PersonValidatorService } from './person-list.validator';
import { environment } from '../../environments/environment';
import { generatePersons, Person } from './person.model';
import { AsyncTableDataSource } from '../ngx-material-table/async/async-table-data-source';
import { tableRowTrackBy } from '../ngx-material-table/virtual-scroll/table-virtual-scroll.utils';

@Component({
    selector: 'app-person-list-scrollable',
    templateUrl: './person-list-scrollable.component.html',
    styleUrls: ['./person-list-scrollable.component.scss'],
    providers: [{ provide: ValidatorService, useClass: PersonValidatorService }],
    standalone: false
})
export class PersonListScrollableComponent implements OnInit {
  private _displayedColumns = ['id', 'name', 'age', 'actionsColumn'];

  get displayedColumns(): string[] {
    if (environment.production) return this._displayedColumns.splice(1); // Remove 'id'
    return this._displayedColumns;
  }

  @Input() personList: Person[];
  @Output() personListChange = new EventEmitter<Person[]>();

  dataSource: AsyncTableDataSource<Person>;

  constructor(private personValidator: ValidatorService) {
    this.personList = generatePersons(10000);
  }

  ngOnInit() {
    this.dataSource = new AsyncTableDataSource<Person>(this.personList || [], Person, this.personValidator, {
      prependNewElements: false,
      suppressErrors: !environment.production,
      // The table slices the rendered window; the datasource keeps every row
      virtualScroll: true,
    });

    this.dataSource.datasourceSubject.subscribe((personList) => this.personListChange.emit(personList));
  }

  trackByFn = tableRowTrackBy;

  generatePersons = generatePersons;

  async addRow() {
    return await this.dataSource.createNew();
  }
}
