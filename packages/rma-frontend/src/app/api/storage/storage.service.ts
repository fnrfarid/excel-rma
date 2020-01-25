import { Injectable, Inject } from '@angular/core';
export const STORAGE_TOKEN = 'StorageObject';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor(@Inject(STORAGE_TOKEN) private readonly storage) {}

  async getItem(key: string) {
    return await this.storage.getItem(key);
  }

  async setItem(key: string, value: unknown) {
    return await this.storage.setItem(key, value);
  }

  async removeItem(key: string) {
    return await this.storage.removeItem(key);
  }

  async clear() {
    return await this.storage.clear();
  }

  async getItems(keys: string[]) {
    const data = {};
    for (const key in keys) {
      if (key) {
        data[keys[key]] = await this.getItem(keys[key]);
      }
    }
    return data;
  }
}
