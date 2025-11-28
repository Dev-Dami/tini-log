# API Reference

This section offers a detailed reference for the `dd-tinylog` API.

## Logger Class

The `Logger` class is the main entry point for all logging functions.

### `new Logger(options?: LoggerOptions)`

Creates a new logger instance.

**Parameters:**

- `options` (`LoggerOptions`, optional): Configuration options for the logger.

  - `level` (`LogLevel`, default: `'info'`): The lowest log level to output.
  - `colorize` (`boolean`, default: `true`): Whether to color the console output.
  - `json` (`boolean`, default: `false`): Whether to format logs as JSON.
  - `transports` (`TransportOptions[]`, default: `[]`): An array of transports to use.
  - `timestampFormat` (`string`, default: `'YYYY-MM-DD HH:mm:ss'`): The format for timestamps.
  - `prefix` (`string`, default: `''`): A prefix to add to all log messages.
  - `timestamp` (`boolean`, default: `false`): Whether to include a timestamp in the log output.
  - `async` (`boolean`, default: `false`): Whether to enable asynchronous logging mode for better performance under heavy logging.
  - `context` (`Record<string, any>`, optional): An object with key-value pairs to merge into all log metadata.
  - `parent` (`Logger`, internal): Used internally when creating child loggers. Do not set manually.

### `Logger.global`

A static property that provides a global logger instance. This is helpful for quick setups or logging from different parts of your application without passing the logger instance around.

```typescript
import { Logger } from 'dd-tinylog';

Logger.global.info('This is a global log message.');
```

### Methods

#### `createChild(options?: LoggerOptions)`

Creates a new child logger instance that inherits settings from the current logger. The child logger can override parent settings and add its own context.

**Parameters:**

- `options` (`LoggerOptions`, optional): Configuration options for the child logger. These options will override the parent's settings if provided.

**Returns:**

- (`Logger`): A new child logger instance.

```typescript
const childLogger = logger.createChild({
  prefix: '[Child]',
  context: { userId: 123 },
});
childLogger.info('Message from child logger');
```

#### `debug(message: string, metadata?: Record<string, any>)`

Logs a message at the `debug` level.

#### `info(message: string, metadata?: Record<string, any>)`

Logs a message at the `info` level.

#### `warn(message: string, metadata?: Record<string, any>)`

Logs a message at the `warn` level.

#### `error(message: string, metadata?: Record<string, any>)`

Logs a message at the `error` level.

#### `silent(message: string, metadata?: Record<string, any>)`

Logs a message at the `silent` level. Silent messages are not written to any transport.

#### `boring(message: string, metadata?: Record<string, any>)`

Logs a message at the `boring` level.

#### `setLevel(level: LogLevel)`

Changes the minimum log level during runtime.

```typescript
logger.setLevel('debug');
```

#### `setFormat(format: 'text' | 'json')`

Switches between `'text'` and `'json'` formatting during runtime.

```typescript
logger.setFormat('json');
```

#### `setAsync(async: boolean)`

Enables or disables asynchronous logging mode during runtime.

```typescript
logger.setAsync(true); // Enable async mode
logger.setAsync(false); // Disable async mode (back to sync mode)
```

#### `addTransport(transport: Transport)`

Adds an extra transport to the logger during runtime.

```typescript
import { FileTransport } from 'dd-tinylog';

logger.addTransport(new FileTransport({ path: './logs/another.log' }));
```

## LogLevel Type

The `LogLevel` type defines the different logging levels available in `dd-tinylog`.

- `'debug'`
- `'info'`
- `'warn'`
- `'error'`
- `'silent'`
- `'boring'`
