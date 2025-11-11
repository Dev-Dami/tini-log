import { LogLevel } from "./LogLevel";
import { Formatter } from "./Formatter";
import {
  Transport,
  ConsoleTransport,
  FileTransport,
  FileTransportOptions,
} from "../transports";
import { TransportOptions } from "../types";

export interface LoggerOptions {
  level?: LogLevel;
  colorize?: boolean;
  json?: boolean;
  transports?: TransportOptions[];
  timestampFormat?: string;
  prefix?: string;
  timestamp?: boolean;
}

export interface LogData {
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any> | undefined;
  prefix?: string;
}

export class Logger {
  private level: LogLevel;
  private transports: Transport[] = [];
  private formatter: Formatter;
  private static _global: Logger;

  prefix: string;
  timestamp: boolean;

  constructor(options: LoggerOptions = {}) {
    const {
      level = "info",
      colorize = true,
      json = false,
      transports = [{ type: "console" }],
      timestampFormat = "YYYY-MM-DD HH:mm:ss",
      prefix = "",
      timestamp = false,
    } = options;

    this.level = level;
    this.prefix = prefix;
    this.timestamp = timestamp;
    this.formatter = new Formatter({
      colorize,
      json,
      timestampFormat,
      timestamp,
    });

    // Init transports
    for (const transportOption of transports) {
      if (transportOption.type === "console") {
        const consoleTransport = new ConsoleTransport({
          colorize: transportOption.options?.colorize ?? colorize,
        });
        this.transports.push(consoleTransport);
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
          this.transports.push(fileTransport);
        }
      }
    }
    if (!Logger._global) {
      Logger._global = this;
    }
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

    const logData: LogData = {
      level,
      message,
      timestamp: new Date(),
      metadata,
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

  static get global(): Logger {
    if (!Logger._global) {
      Logger._global = new Logger();
    }
    return Logger._global;
  }
}
