# dd-tinylog

[![npm version](https://badge.fury.io/js/teeny-logger.svg)](https://badge.fury.io/js/dd-tinylog)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A minimal, fast, and feature-rich logging library for Node.js.

`dd-tinylog` is designed to be a dead simple lightweight and easy-to-use logger with support for multiple transports, customizable formatting, and dynamic log levels.

## Features

- **Lightweight and Fast**: Minimal overhead for high-performance applications.
- **Multiple Transports**: Log to the console, files, or create your own custom transports.
- **Customizable Formatting**: Choose between simple text or structured JSON logging.
- **Dynamic Log Levels**: Change the log level at runtime.
- **Customizable Prefix**: Add a custom prefix to all your log messages.
- **Optional Timestamps**: Enable or disable timestamps in your logs.
- **File Rotation**: Automatically rotate log files based on size.
- **TypeScript Support**: Written in TypeScript.

## Installation

```bash
npm install dd-tinylog
```

## Usage

```typescript
// ESM
import { Logger } from 'dd-tinylog';
// CommonJS
const { Logger } = require("dd-tinylog");

// Create a logger instance
const logger = new Logger({
  level: 'info',
  colorize: true,
  transports: [
    { type: 'console' },
    { type: 'file', options: { path: './logs/app.log' } },
  ],
  prefix: '[My-App]',
  timestamp: true,
});

// Log messages
logger.info('Server started on port 3000');
logger.warn('Low disk space');
logger.error('Failed to connect to database', { code: 500 });
logger.debug('This is a debug message');
logger.silent('This message will not be logged');
logger.boring('This message will be logged but not colored');
```

## License

This project is licensed under the MIT License. See the [LICENSE](/LICENSE) file for details.

## Uses for this Library

`dd-tinylog` is a flexible logging tool for many kinds of Node.js applications:

* **Web Servers & APIs** – Record requests, errors, and performance data.
* **Command-Line Tools (CLI)** – Display progress, warnings, and errors clearly for users.
* **Background Jobs** – Track scheduled or long-running tasks.
* **Microservices** – Collect logs from multiple services for easier debugging.
* **Development & Testing** – Adjust log levels to show more or less detail while building or testing.

---

## Planned Improvements

We’re working on several new features and enhancements for `dd-tinylog`:

* **Child Loggers** – Create sub-loggers that inherit settings from the main logger but can add their own tags (e.g., a user ID). This helps organize and filter logs by component.
* **Asynchronous Transports** – Write logs in the background to prevent blocking the main application, improving performance under heavy logging.
* **Custom Log Levels** – Define your own log levels beyond the built-in ones like `info` or `error`.
* **Performance Optimizations** – Further reduce overhead and improve log throughput.
