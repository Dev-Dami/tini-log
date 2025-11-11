import { LogData } from '../types';
import { Formatter } from '../core/Formatter';

export interface Transport {
  write(data: LogData, formatter: Formatter): void;
}