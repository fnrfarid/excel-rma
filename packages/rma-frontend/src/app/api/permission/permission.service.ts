import { SYSTEM_MANAGER, USER_ROLE, CLOSE } from '../../constants/app-string';
import { StorageService } from '../storage/storage.service';
import { from, of, throwError } from 'rxjs';
import {
  switchMap,
  catchError,
  retryWhen,
  delay,
  take,
  concat,
} from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as _ from 'lodash';
import { Injectable } from '@angular/core';

export const PermissionState = {
  create: 'create',
  read: 'read',
  update: 'update',
  delete: 'delete',
};

export const PermissionRoles = {
  sales_invoice: {
    create: [],
    read: [],
    update: [],
    delete: [],
    submit: [],
  },

  delivery_note: {
    create: [],
    read: [],
    update: [],
    delete: [],
  },

  sales_return: {
    create: [],
    read: [],
    update: [],
    delete: [],
  },

  rd_products: {
    read: [],
    create: [],
  },

  credit_note: {
    read: [],
  },

  purchase_invoice: {
    read: [],
  },

  purchase_receipt: {
    create: [],
    read: [],
  },

  warranty_claim: {
    create: [],
    read: [],
    update: [],
    delete: [],
  },

  service_invoice: {
    create: [],
    read: [],
  },

  status_history: {
    create: [],
    read: [],
    update: [],
    delete: [],
  },

  stock_history: {
    create: [],
    read: [],
  },

  jobs: {
    read: [],
    update: [],
  },

  customer_profile: {
    read: [],
  },

  settings: {
    read: [],
    update: [],
  },
};

@Injectable({
  providedIn: 'root',
})
export class PermissionManager {
  constructor(
    private readonly storageService: StorageService,
    private readonly snackBar: MatSnackBar,
  ) {}

  getPermission(module: string, state: string) {
    return of({}).pipe(
      switchMap(object => {
        return from(this.storageService.getItem(USER_ROLE));
      }),
      switchMap((roles: string[]) => {
        if (roles && roles.length) {
          return this.validateRoles(roles, module, state);
        }
        return throwError('Retry');
      }),
      retryWhen(errors =>
        errors.pipe(delay(300), take(10), concat(throwError('Retry'))),
      ),
      catchError(err => {
        this.snackBar.open('Error in fetching roles, please reload', CLOSE, {
          duration: 3500,
        });
        return of(false);
      }),
    );
  }

  validateRoles(user_roles: string[], module: string, state: string) {
    const roles = [];
    if (state === 'active') {
      roles.push(...this.getActiveRoles(module, state));
    } else {
      try {
        roles.push(...PermissionRoles[module][state]);
      } catch {
        return throwError('Module and state dose not exist.');
      }
    }
    return of(_.intersection(user_roles, roles));
  }

  getActiveRoles(module, state) {
    const roles = new Set();
    roles.add(SYSTEM_MANAGER);
    Object.keys(PermissionState).forEach(key => {
      PermissionRoles[module][key].forEach(role => {
        roles.add(role);
      });
    });
    return Array.from(roles);
  }
}
