import { Logger } from './core/Logger';
import { LogLevel } from './core/LogLevel';
import { ConsoleTransport, FileTransport, Transport } from './transports';
import { TransportOptions, LoggerConfig } from './types/index';
import { CustomLogLevelConfig } from './core/CustomLogLevel';

export { Logger, ConsoleTransport, FileTransport };
export type { LogLevel, Transport, TransportOptions, LoggerConfig, CustomLogLevelConfig };
export default Logger;
