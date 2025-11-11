import { LogData } from './Logger';
import { TimeUtil } from '../utils/TimeUtil';
import { ColorUtil } from '../utils/ColorUtil';

export interface FormatterOptions {
  colorize?: boolean;
  json?: boolean;
  timestampFormat?: string;
  timestamp?: boolean;
}

export class Formatter {
  private colorize: boolean;
  private json: boolean;
  private timestampFormat: string;
  private timestamp: boolean;

  constructor(options: FormatterOptions = {}) {
    const {
      colorize = true,
      json = false,
      timestampFormat = "YYYY-MM-DD HH:mm:ss",
      timestamp = false,
    } = options;
    this.colorize = colorize;
    this.json = json;
    this.timestampFormat = timestampFormat;
    this.timestamp = timestamp;
  }

  format(data: LogData): string {
    if (this.json) {
      return this.formatAsJson(data);
    } else {
      return this.formatAsText(data);
    }
  }

  private formatAsJson(data: LogData): string {
    const formattedData: any = {
      level: data.level,
      message: data.message,
      ...data.metadata,
    };

    if (this.timestamp) {
      formattedData.timestamp = data.timestamp.toISOString();
    }

    if (data.prefix) {
      formattedData.prefix = data.prefix;
    }

    return JSON.stringify(formattedData);
  }

  private formatAsText(data: LogData): string {
    let output = "";
    if (this.timestamp) {
      const timestamp = TimeUtil.format(data.timestamp, this.timestampFormat);
      output += `[${timestamp}] `;
    }

    let level = data.level.toUpperCase();

    if (this.colorize) {
      level = ColorUtil.colorize(level, data.level);
    }

    output += `${level} - `;

    if (data.prefix) {
      output += `${data.prefix} `;
    }

    output += data.message;

    if (data.metadata) {
      output += ` ${JSON.stringify(data.metadata)}`;
    }

    return output;
  }

  setJson(json: boolean): void {
    this.json = json;
  }
}