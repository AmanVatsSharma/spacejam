/**
 * File:        apps/api/src/types/multer.d.ts
 * Module:      API · Types
 * Purpose:     Minimal ambient declaration for `multer` so the upload
 *              controller typechecks without pulling in @types/multer.
 *              Only the surface we use (diskStorage) is declared.
 */
declare module 'multer' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyFn = (...args: any[]) => any;
  export interface DiskStorageOptions {
    destination?: string | AnyFn;
    filename?: AnyFn;
  }
  export function diskStorage(options: DiskStorageOptions): any;
  const multer: any;
  export default multer;
}
