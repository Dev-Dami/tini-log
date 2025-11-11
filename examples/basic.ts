import { Logger } from "../src";

// create a logger instance
const logger = new Logger({
  level: "info",
  colorize: true,
  json: false,
  transports: [
    { type: "console" },
    { type: "file", options: { path: "./logs/app.log" } },
  ],
  timestampFormat: "YYYY-MM-DD HH:mm:ss",
});

// basic logs commands
logger.info("Server started");
logger.warn("Low disk space");
logger.error("Unhandled exception", { code: 500, route: "/api/user" });
logger.debug("Cache miss", { key: "user:1234" });
logger.boring("This is a boring message.");
logger.silent("This message will not be shown.");

// JSON structured logging switches mode dynamically
logger.setFormat("json");
logger.info("User login", { userId: 42, ip: "127.0.0.1" });
logger.setFormat("text");

// Logger with prefix and timestamp
const prefixedLogger = new Logger({
  level: "info",
  prefix: "[WebApp]",
  timestamp: true,
});

prefixedLogger.info("This message has a prefix and a timestamp.");
prefixedLogger.warn("This is another message with a prefix and a timestamp.");


// Optional: but static shortcut
Logger.global.info("Something global happened");
