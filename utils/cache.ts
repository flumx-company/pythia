import { promisify } from 'util';
import NodeCache from 'node-cache';

const cache = new NodeCache();
const asyncGet = promisify(cache.get);
const asyncDelete = promisify(cache.del);

export default {
  get: async (key: string): Promise<any> => asyncGet(key),

  set: async (key: string | number, value: object, ttl: number = 0): Promise<any> => new Promise((resolve, reject) => {
    cache.set(key, value, ttl, (err: Error, success: boolean) => {
      if (err) {
        return reject(err);
      }

      resolve(success);
    });
  }),

  delete: async (key: string | string[]) => asyncDelete(key),

  deleteAll: () => cache.flushAll(),
};
