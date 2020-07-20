declare module "logdna" {
  enum LogLevel {
    trace,
    debug,
    info,
    warn,
    error,
    fatal
  }

  interface ConstructorOptions {
    level?: LogLevel;
    tags?: string | string[];
    meta?: object;
    timeout?: number;
    hostname?: string;
    mac?: string;
    ip?: string;
    url?: string;
    flushLimit?: number;
    flushIntervalMs?: number;
    shimProperties?: string[];
    indexMeta?: boolean;
    app?: string;
    env?: string;
    baseBackoffMs?: number;
    maxBackoffMs?: number;
    withCredentials?: boolean;
  }

  interface LogOptions {
    level?: LogLevel;
    app?: string;
    env?: string;
    timestamp?: number;
    context?: object;
    indexMeta?: boolean;
    meta?: object;
  }

  export interface Logger {
    info(statement: string | object, options?: Omit<LogOptions, 'level'>): void;
    warn(statement: string | object, options?: Omit<LogOptions, 'level'>): void;
    debug(statement: string | object, options?: Omit<LogOptions, 'level'>): void;
    error(statement: string | object, options?: Omit<LogOptions, 'level'>): void;
    fatal(statement: string | object, options?: Omit<LogOptions, 'level'>): void;
    trace(statement: string | object, options?: Omit<LogOptions, 'level'>): void;
    log(statement: string | object, options?: LogOptions): void;
    addMetaProperty(key: string, value: any): void;
    removeMetaProperty(key: string): void;
    flush(): void;
  }

  export function createLogger(
    key: string,
    options?: ConstructorOptions
  ): Logger;

  export function setupDefaultLogger(
    key: string,
    options?: ConstructorOptions
  ): Logger;
}
