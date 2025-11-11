import { Logger } from './core/Logger';
import { LogLevel } from './core/LogLevel';
import { ConsoleTransport, FileTransport, Transport } from './transports';
import { TransportOptions, LoggerConfig } from './types/index';

export { Logger, ConsoleTransport, FileTransport };
export type { LogLevel, Transport, TransportOptions, LoggerConfig };
export default Logger;
