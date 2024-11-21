// types/xlsx.d.ts
declare module 'xlsx' {
  export interface WorkBook {}
  export interface WorkSheet {}
  
  export interface Utils {
    book_new(): WorkBook;
    json_to_sheet<T>(data: T[], opts?: any): WorkSheet;
    book_append_sheet(wb: WorkBook, ws: WorkSheet, name: string): void;
  }
  
  export const utils: Utils;
  export function writeFile(wb: WorkBook, filename: string): void;
}
