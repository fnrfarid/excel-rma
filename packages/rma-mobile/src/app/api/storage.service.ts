import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { share } from 'rxjs/operators';

@Injectable()
export class StorageService implements OnDestroy {
  private onSubject = new Subject<{ key: string; value: any }>();
  public changes = this.onSubject.asObservable().pipe(share());

  constructor() {
    this.start();
  }

  ngOnDestroy() {
    this.stop();
  }

  public getStorage() {
    const s = [];
    for (let i = 0; i < localStorage.length; i++) {
      s.push({
        key: localStorage.key(i),
        value: JSON.parse(localStorage.getItem(localStorage.key(i))),
      });
    }
    return s;
  }

  public store(key: string, value: string): void {
    localStorage.setItem(key, value);
    // the local application doesn't seem to catch changes to localStorage...
    this.onSubject.next({ key, value });
  }

  public clear(key: string) {
    localStorage.removeItem(key);
    // the local application doesn't seem to catch changes to localStorage...
    this.onSubject.next({ key, value: null });
  }

  private start(): void {
    window.addEventListener('storage', this.storageEventListener.bind(this));
  }

  private storageEventListener(event: StorageEvent) {
    if (event.storageArea === localStorage) {
      let v;
      try {
        v = JSON.parse(event.newValue);
      } catch (e) {
        v = event.newValue;
      }
      this.onSubject.next({ key: event.key, value: v });
    }
  }

  private stop(): void {
    window.removeEventListener('storage', this.storageEventListener.bind(this));
    this.onSubject.complete();
  }
}
