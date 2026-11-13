declare module 'node:sqlite' {
  export type SQLInputValue = string | number | bigint | Uint8Array | null;
  export type SQLOutputValue = string | number | bigint | Uint8Array | null;

  export interface StatementResultingChanges {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export class StatementSync {
    run(...params: SQLInputValue[]): StatementResultingChanges;
    get(...params: SQLInputValue[]): Record<string, SQLOutputValue> | undefined;
    all(...params: SQLInputValue[]): Array<Record<string, SQLOutputValue>>;
  }

  export interface DatabaseSyncOptions {
    open?: boolean;
    readOnly?: boolean;
  }

  export class DatabaseSync {
    constructor(location: string, options?: DatabaseSyncOptions);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}

