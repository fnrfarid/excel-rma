import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';

export function ValidateInputSelected(
  formControl: FormControl,
  options: Observable<any[]>,
) {
  options.subscribe({
    next: (data: any[]) => {
      if (typeof formControl.value === 'object') {
        return true;
      }
      if (data.includes(formControl.value)) {
        return true;
      }
      if (typeof data[0] !== 'string') {
        let result = false;
        data.forEach(obj => {
          if (Object.keys(obj).find(key => obj[key] === formControl.value)) {
            result = true;
          }
          return;
        });
        if (result) return;
      }
      formControl.setErrors({ falseValse: formControl.value });
    },
  });
}
