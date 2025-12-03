import { LogLevel } from "../core/LogLevel";
import { CustomLogLevelConfig } from "../core/CustomLogLevel";
import { Transport } from "../transports/Transport";

export interface LogData {
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any> | undefined;
  prefix?: string;
}

export interface TransportOptions {
  type: "console" | "file" | "custom";
  options?: {
    path?: string;
    colorize?: boolean;
    maxSize?: number;
    maxFiles?: number;
  };
  instance?: Transport;
}

export interface LoggerConfig {
  level?: LogLevel;
  colorize?: boolean;
  json?: boolean;
  transports?: TransportOptions[];
  timestampFormat?: string;
  prefix?: string;
  timestamp?: boolean;
  async?: boolean;
}
