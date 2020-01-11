declare module "logdna" {
  interface ConstructorOptions {
    /** The default app passed along with every log sent through this instance. */
    app?: string;
    /** The default hostname passed along with every log sent through this instance. */
    hostname?: string;
    /** The default environment passed along with every log sent through this instance. */
    env?: string;
    /**
     * We allow meta objects to be passed with each line. By default these meta objects
     * will be stringified and will not be searchable, but will be displayed for informational
     * purposes. If this option is turned to true then meta objects will be parsed and will be
     * searchable up to three levels deep. Any fields deeper than three levels will be
     * stringified and cannot be searched.
     * WARNING: When this option is true, your metadata objects across all types of log
     * messages MUST have consistent types or the metadata object may not be parsed properly!
     */
    index_meta?: boolean;
    /** The default IP Address passed along with every log sent through this instance. */
    ip?: string;
    /**
     * The default level passed along with every log sent through this instance.
     * Expected value is "Debug", "Trace", "Info", "Warn", "Error", "Fatal" or any custom
     * level of your choice.
     */
    level?: string;
    /** The default MAC Address passed along with every log sent through this instance. */
    mac?: string;
    /**
     * By default the line has a maximum length of 32000 chars, this can be turned off with
     * the value false.
     */
    max_length?: boolean;
    /** The length of the timeout on the POST request that is sent to LogDNA. */
    timeout?: number;
    /**
     * The withCredentials option passed to the request library. In order to make CORS
     * requests this value is set to false by default.
     */
    with_credentials?: boolean;
  }
  interface LogOptions {
    /**
     * The level passed along with this log line.
     * Expected value is "Debug", "Trace", "Info", "Warn", "Error", "Fatal" or any custom
     * level of your choice.
     */
    level?: string;
    /** The app passed along with this log line. */
    app?: string;
    /** The environment passed along with this log line. */
    env?: string;
    /** A meta object that provides additional context about the log line that is passed. */
    meta?: Object;
    /**
     * We allow meta objects to be passed with each line. By default these meta objects
     * will be stringified and will not be searchable, but will be displayed for informational
     * purposes. If this option is turned to true then meta objects will be parsed and will be
     * searchable up to three levels deep. Any fields deeper than three levels will be
     * stringified and cannot be searched.
     * WARNING: When this option is true, your metadata objects across all types of log
     * messages MUST have consistent types or the metadata object may not be parsed properly!
     */
    index_meta?: boolean;
    /**
     * A timestamp in ms, must be within one day otherwise it will be dropped and Date.now()
     * will be used in its place.
     */
    timestamp?: number;

    tags?: string | string[];
  }

  export interface LogDna {
    info(line: string, options?: Omit<LogOptions, 'level'>): void;
    warn(line: string, options?: Omit<LogOptions, 'level'>): void;
    debug(line: string, options?: Omit<LogOptions, 'level'>): void;
    error(line: string, options?: Omit<LogOptions, 'level'>): void;
    fatal(line: string, options?: Omit<LogOptions, 'level'>): void;
    trace(line: string, options?: Omit<LogOptions, 'level'>): void;
    log(line: string, options?: LogOptions): void;
    /**
     * Adds key/value pair into the logger's default meta.
     */
    addMetaProperty(key: string, value: any): void;
    /**
     * Removes the key and associated value from the logger's default meta.
     */
    removeMetaProperty(key: string): void;
  }

  export function createLogger(
    key: string,
    options?: ConstructorOptions
  ): LogDna;
  
  /**
   * Flushes all existing loggers that are instantiated by createLogger.
   */
  export function flushAll(callback?: (errMessage?: string) => void): void;

  /**
   * Flushes all existing loggers that are instantiated by createLogger, and then removes
   * references to them. Should only be called when you are finished logging.
   */
  export function cleanUpAll(callback?: (errMessage?: string) => void): void;
}
