# dd-tinylog

[![npm version](https://badge.fury.io/js/dd-tinylog.svg)](https://badge.fury.io/js/dd-tinylog)  
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A minimal, fast, and low-overhead logging library for Node.js. It is designed for various applications, including web servers, CLIs, and microservices.

## Features

`dd-tinylog` offers a solid set of features for efficient and flexible logging. Learn more about what it can do in the [Features Documentation](./docs/features.md).

## Installation

```bash
npm install dd-tinylog
```

## Usage

```typescript
import { Logger } from 'dd-tinylog';

// Create a logger instance
const logger = new Logger({
  level: 'info',
  colorize: true,
  transports: [{ type: 'console' }],
  prefix: '[My-App]',
});

// Log messages
logger.info('Server started on port 3000');
logger.error('Failed to connect to database', { code: 500 });
```

For more details on usage, configurations, and examples including child loggers, check the [Usage Guide](./docs/usage.md).

## License

This project is licensed under the MIT License. See the [LICENSE](/LICENSE) file for details.

## Uses for this Library

`dd-tinylog` is a versatile logging tool for various Node.js applications. Explore common use cases and how this library can help your projects in the [Library Uses Documentation](./docs/library-uses.md).

## Planned Improvements

We are always working on improving `dd-tinylog`. See what’s coming next in the [Planned Improvements Documentation](./docs/planned-improvements.md).
