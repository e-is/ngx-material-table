import {ValidatorService} from '../ngx-material-table/validator.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Injectable} from '@angular/core';

@Injectable()
export class PersonValidatorService implements ValidatorService {
  getRowValidator(): FormGroup {
    return new FormGroup({
      name: new FormControl(null, Validators.required),
      age: new FormControl(null, Validators.compose([Validators.min(0), Validators.max(120)]))
    });
  }
}
