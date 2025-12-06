import { LogLevel } from "./LogLevel";
import { Formatter } from "./Formatter";
import {
  Transport,
  ConsoleTransport,
  FileTransport,
  FileTransportOptions,
  ConsoleTransportOptions,
} from "../transports";
import { TransportConfig, LegacyTransportOptions, LogData } from "../types";

export interface LoggerOptions {
  level?: LogLevel;
  colorize?: boolean;
  json?: boolean;
  transports?: TransportConfig[];
  timestampFormat?: string;
  prefix?: string;
  timestamp?: boolean;
  context?: Record<string, any>;
  parent?: Logger;
  asyncMode?: boolean;
  customLevels?: { [level: string]: number }; // level name and priority
  customColors?: { [level: string]: string }; // level name and color
}

export class Logger {
  private level: LogLevel;
  private transports: Transport[] = [];
  private formatter: Formatter;
  private context: Record<string, any>;
  private parent: Logger | undefined;
  private asyncMode: boolean;
  private customLevels: { [level: string]: number };
  private static _global: Logger;
  private static readonly LEVEL_PRIORITIES: { [level: string]: number } = {
    silent: 0,
    boring: 1,
    debug: 2,
    info: 3,
    warn: 4,
    error: 5,
  };

  prefix: string;
  timestamp: boolean;

  constructor(options: LoggerOptions = {}) {
    const {
      level,
      colorize,
      json,
      transports = [],
      timestampFormat = "YYYY-MM-DD HH:mm:ss",
      prefix,
      timestamp,
      context = {},
      parent,
      asyncMode,
      customLevels = {},
      customColors = {},
    } = options;

    this.parent = parent; // Set parent
    this.context = { ...context }; // Init context
    this.customLevels = customLevels; // Store custom log levels
    this.asyncMode = false;

    if (this.parent) {
      this.level = level ?? this.parent.level;
      this.prefix = prefix ?? this.parent.prefix;
      this.timestamp = timestamp ?? this.parent.timestamp;
      this.asyncMode = asyncMode ?? this.parent.asyncMode;
      this.transports =
        transports && transports.length > 0
          ? this.initTransports(
              transports,
              this.getDefaultColorizeValue(colorize),
            )
          : this.parent.transports;
      // Merge colors; child overrides parent
      const mergedCColors = {
        ...this.parent.formatter.getCustomColors(),
        ...customColors,
      };
      this.formatter = new Formatter({
        colorize:
          this.getDefaultColorizeValue(colorize) ??
          this.parent.formatter.isColorized(),
        json: json ?? this.parent.formatter.isJson(),
        timestampFormat:
          timestampFormat ?? this.parent.formatter.getTimestampFormat(),
        timestamp: timestamp ?? this.parent.formatter.hasTimestamp(),
        customColors: mergedCColors,
      });
      this.context = { ...this.parent.context, ...this.context };
      // Merge custom levels with parent's custom levels
      this.customLevels = { ...this.parent.customLevels, ...customLevels };
    } else {
      // Auto-configure based on environment
      const isProd = this.isProductionEnvironment();

      this.level = level ?? this.getDefaultLevel(isProd);
      this.prefix = prefix ?? "";
      this.timestamp = timestamp ?? this.getDefaultTimestamp(isProd);

      const defaultTransports =
        transports && transports.length > 0
          ? transports
          : this.getDefaultTransports(isProd);

      this.asyncMode = asyncMode ?? this.getDefaultAsyncMode(isProd);

      this.transports = this.initTransports(
        defaultTransports,
        this.getDefaultColorizeValue(colorize),
      );

      this.formatter = new Formatter({
        colorize: this.getDefaultColorizeValue(colorize),
        json: json ?? this.getDefaultJson(isProd),
        timestampFormat,
        timestamp: this.getDefaultTimestamp(isProd),
        customColors,
      });
    }

    if (!Logger._global) {
      Logger._global = this;
    }
  }

  private isProductionEnvironment(): boolean {
    const env = process.env.NODE_ENV?.toLowerCase();
    return env === "production" || env === "prod";
  }

  private getDefaultLevel(isProd: boolean): LogLevel {
    return isProd ? "warn" : "debug";
  }

  private getDefaultColorizeValue(colorize: boolean | undefined): boolean {
    if (colorize !== undefined) {
      return colorize;
    }
    const isProd = this.isProductionEnvironment();
    return !isProd;
  }

  private getDefaultJson(isProd: boolean): boolean {
    return isProd;
  }

  private getDefaultTimestamp(isProd: boolean): boolean {
    return true;
  }

  private getDefaultTransports(isProd: boolean): TransportConfig[] {
    if (isProd) {
      return [new ConsoleTransport(), new FileTransport({ path: "./logs/app.log" })];
    } else {
      return [new ConsoleTransport()];
    }
  }

  private getDefaultAsyncMode(isProd: boolean): boolean {
    return isProd;
  }

  private initTransports(
    transportConfigs: TransportConfig[],
    defaultColorize: boolean,
  ): Transport[] {
    const initializedTransports: Transport[] = [];
    for (const transportConfig of transportConfigs) {
      // Check if it's a legacy config object
      if (this.isLegacyTransportOptions(transportConfig)) {
        const transportOption = transportConfig as LegacyTransportOptions;
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
      // Validate transport objects that implement the Transport interface
      else if (this.isTransport(transportConfig)) {
        initializedTransports.push(transportConfig as Transport);
      }
    }
    return initializedTransports;
  }

  private isLegacyTransportOptions(
    config: TransportConfig,
  ): config is LegacyTransportOptions {
    return typeof config === "object" && config !== null && "type" in config;
  }

  private isTransport(obj: any): obj is Transport {
    return obj && typeof obj.write === "function" && (typeof obj.writeAsync === "function" || obj.writeAsync === undefined);
  }

  private shouldLog(level: LogLevel): boolean {
    // Get the priority of the current logger level
    const currentLevelPriority = this.getLevelPriority(this.level);
    // Get the priority of the message level
    const messageLevelPriority = this.getLevelPriority(level);

    return messageLevelPriority >= currentLevelPriority;
  }

  private getLevelPriority(level: LogLevel): number {
    // use a static map to avoid repeated allocations
    if (Logger.LEVEL_PRIORITIES.hasOwnProperty(level)) {
      return Logger.LEVEL_PRIORITIES[level]!;
    }
    // Check if it's a custom level
    if (this.customLevels && level in this.customLevels) {
      const customPriority = this.customLevels[level];
      return customPriority !== undefined ? customPriority : 999;
    }
    return 999;
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }
    // Don't log silent level logs at all
    if (level === "silent") {
      return;
    }

    if (this.asyncMode) {
      // For async mode, we need to call the direct method
      this.logAsyncDirect(level, message, metadata);
    } else {
      // Only create timestamp after confirming log should be written
      const timestamp = new Date();

      // optimize metadata merging
      let finalMetadata: Record<string, any> | undefined;
      if (this.context && Object.keys(this.context).length > 0) {
        if (metadata) {
          finalMetadata = { ...this.context, ...metadata };
        } else {
          finalMetadata = this.context;
        }
      } else if (metadata) {
        finalMetadata = metadata;
      }

      // Only add metadata if it's not empty after merging
      const logData: LogData = {
        level,
        message,
        timestamp,
        metadata:
          finalMetadata && Object.keys(finalMetadata).length > 0
            ? finalMetadata
            : undefined,
        prefix: this.prefix,
      };

      for (const transport of this.transports) {
        transport.write(logData, this.formatter);
      }
    }
  }

  private logAsyncDirect(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }
    // Donot log silent level logs at all
    if (level === "silent") {
      return;
    }

    // Timestamp only on confirmed log
    const timestamp = new Date();

    // optimize metadata merging
    let finalMetadata: Record<string, any> | undefined;
    if (this.context && Object.keys(this.context).length > 0) {
      if (metadata) {
        finalMetadata = { ...this.context, ...metadata };
      } else {
        finalMetadata = this.context;
      }
    } else if (metadata) {
      finalMetadata = metadata;
    }

    // Only add metadata if it's not empty after merging
    const logData: LogData = {
      level,
      message,
      timestamp,
      metadata:
        finalMetadata && Object.keys(finalMetadata).length > 0
          ? finalMetadata
          : undefined,
      prefix: this.prefix,
    };

    for (const transport of this.transports) {
      if (transport.writeAsync) {
        transport.writeAsync(logData, this.formatter).catch((error) => {
          console.error("Error during async logging:", error);
        });
      } else {
        setImmediate(() => {
          transport.write(logData, this.formatter);
        });
      }
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

  /**
   * Generic log method that allows logging with custom levels
   */
  logWithLevel(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ): void {
    this.log(level, message, metadata);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setFormat(format: "text" | "json"): void {
    this.formatter.setJson(format === "json");
  }

  setAsyncMode(asyncMode: boolean): void {
    this.asyncMode = asyncMode;
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

  startTimer(name: string): any {
    const { Timer } = require("../utils/Timerutil");
    return new Timer(name, (message: string) => this.info(message));
  }
}
