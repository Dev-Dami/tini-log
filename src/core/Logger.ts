import { LogLevel } from "./LogLevel";
import { Formatter } from "./Formatter";
import {
  Transport,
  ConsoleTransport,
  FileTransport,
  FileTransportOptions,
} from "../transports";
import { TransportOptions, LogData } from "../types";

export interface LoggerOptions {
  level?: LogLevel;
  colorize?: boolean;
  json?: boolean;
  transports?: TransportOptions[];
  timestampFormat?: string;
  prefix?: string;
  timestamp?: boolean;
  context?: Record<string, any>;
  parent?: Logger;
}

export class Logger {
  private level: LogLevel;
  private transports: Transport[] = [];
  private formatter: Formatter;
  private context: Record<string, any>;
  private parent: Logger | undefined;
  private static _global: Logger;

  prefix: string;
  timestamp: boolean;

  constructor(options: LoggerOptions = {}) {
    const {
      level,
      colorize = true,
      json = false,
      transports = [],
      timestampFormat = "YYYY-MM-DD HH:mm:ss",
      prefix,
      timestamp,
      context = {},
      parent,
    } = options;

    this.parent = parent; // Set parent
    this.context = { ...context }; // Init context

    if (this.parent) {
      this.level = level ?? this.parent.level;
      this.prefix = prefix ?? this.parent.prefix;
      this.timestamp = timestamp ?? this.parent.timestamp;
      this.transports =
        transports.length > 0
          ? this.initTransports(transports, colorize)
          : this.parent.transports;
      this.formatter = new Formatter({
        colorize: colorize ?? this.parent.formatter.isColorized(),
        json: json ?? this.parent.formatter.isJson(),
        timestampFormat:
          timestampFormat ?? this.parent.formatter.getTimestampFormat(),
        timestamp: timestamp ?? this.parent.formatter.hasTimestamp(),
      });
      this.context = { ...this.parent.context, ...this.context };
    } else {
      this.level = level ?? "info";
      this.prefix = prefix ?? "";
      this.timestamp = timestamp ?? false;
      this.transports = this.initTransports(
        transports.length > 0 ? transports : [{ type: "console" }],
        colorize,
      );
      this.formatter = new Formatter({
        colorize,
        json,
        timestampFormat,
        timestamp: this.timestamp,
      });
    }

    if (!Logger._global) {
      Logger._global = this;
    }
  }

  private initTransports(
    transportOptions: TransportOptions[],
    defaultColorize: boolean,
  ): Transport[] {
    const initializedTransports: Transport[] = [];
    for (const transportOption of transportOptions) {
      if (transportOption.type === "console") {
        const consoleTransport = new ConsoleTransport({
          colorize: transportOption.options?.colorize ?? defaultColorize,
        });
        initializedTransports.push(consoleTransport);
      } else if (transportOption.type === "file") {
        if (transportOption.options?.path) {
          const fileOptions: FileTransportOptions = {
            path: transportOption.options.path,
          };
          if (transportOption.options.maxSize !== undefined) {
            fileOptions.maxSize = transportOption.options.maxSize;
          }
          if (transportOption.options.maxFiles !== undefined) {
            fileOptions.maxFiles = transportOption.options.maxFiles;
          }
          const fileTransport = new FileTransport(fileOptions);
          initializedTransports.push(fileTransport);
        }
      } else if (transportOption.type === "custom") {
        if (transportOption.instance) {
          initializedTransports.push(transportOption.instance);
        }
      }
    }
    return initializedTransports;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = [
      "silent",
      "boring",
      "debug",
      "info",
      "warn",
      "error",
    ];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // Donot log 'silent' level logs at all
    if (level === "silent") {
      return;
    }

    const mergedMetadata = { ...this.context, ...metadata };

    const logData: LogData = {
      level,
      message,
      timestamp: new Date(),
      metadata:
        Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
      prefix: this.prefix,
    };

    for (const transport of this.transports) {
      transport.write(logData, this.formatter);
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.log("error", message, metadata);
  }

  silent(message: string, metadata?: Record<string, any>): void {
    this.log("silent", message, metadata);
  }

  boring(message: string, metadata?: Record<string, any>): void {
    this.log("boring", message, metadata);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setFormat(format: "text" | "json"): void {
    this.formatter.setJson(format === "json");
  }

  addTransport(transport: Transport): void {
    this.transports.push(transport);
  }

  getTimestampSetting(): boolean {
    return this.timestamp;
  }

  static get global(): Logger {
    if (!Logger._global) {
      Logger._global = new Logger();
    }
    return Logger._global;
  }

  createChild(options: LoggerOptions = {}): Logger {
    return new Logger({ ...options, parent: this });
  }
}
