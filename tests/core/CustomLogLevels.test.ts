import { Logger } from '../../src';
import { LogData } from '../../src/types';

describe('Custom Log Levels', () => {
  let logs: LogData[] = [];
  let logger: Logger;

  const createTestTransport = () => ({
    write: (data: LogData) => {
      logs.push(data);
    },
    writeAsync: async (data: LogData) => {
      logs.push(data);
    }
  });

  beforeEach(() => {
    logs = [];
  });

  test('should support custom log levels with priorities', () => {
    logger = new Logger({
      level: 'info',  // 'info' has priority 3
      customLevels: {
        'success': 6,      // Higher than error (5)
        'trace': 0,        // Lower than info (3), so won't appear
        'verbose': 4,      // Higher than info (3), so will appear
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    // Log with custom levels
    logger.logWithLevel('success', 'Success message');
    logger.logWithLevel('trace', 'Trace message');  // Should NOT appear (0 < 3)
    logger.logWithLevel('verbose', 'Verbose message');  // Should appear (4 > 3)
    logger.logWithLevel('debug', 'Debug message');  // Should appear (2 < 3, wait that's wrong)

    // Wait, 'debug' has priority 2 which is < 'info' priority 3
    // So only 'verbose' and 'success' should appear
    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe('success');
    expect(logs[1].level).toBe('verbose');
  });

  test('should not log when level is below threshold', () => {
    logger = new Logger({
      level: 'success',  // Level threshold is high
      customLevels: {
        'success': 6,
        'verbose': 1,
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('verbose', 'Verbose message');
    logger.logWithLevel('success', 'Success message');

    // Only success should appear since verbose priority (1) < success threshold (6)
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('success');
  });

  test('should work with built-in levels alongside custom levels', () => {
    logger = new Logger({
      level: 'debug',  // Level threshold is debug
      customLevels: {
        'custom': 4.5,  // Between warn (4) and error (5)
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.debug('Debug message');
    logger.logWithLevel('custom', 'Custom message');
    logger.error('Error message');

    expect(logs.length).toBe(3);
    expect(logs[0].level).toBe('debug');
    expect(logs[1].level).toBe('custom');
    expect(logs[2].level).toBe('error');
  });

  test('should support custom colors', () => {
    logger = new Logger({
      level: 'info',
      colorize: true,
      customColors: {
        'success': 'green',
        'warning': 'yellow',
        'custom': 'magenta',
      },
      transports: [
        { type: 'console', options: { colorize: true } }
      ]
    });

    // We can't easily test the color output, but we can ensure the logger doesn't crash
    expect(() => {
      logger.logWithLevel('success', 'Success message');
      logger.logWithLevel('warning', 'Warning message');
      logger.logWithLevel('custom', 'Custom message');
    }).not.toThrow();
  });

  test('should support async logging with custom levels', async () => {
    logger = new Logger({
      level: 'info',
      async: true,
      customLevels: {
        'async_level': 7,
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('async_level', 'Async message');
    // Give time for async operation to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('async_level');
  });

  test('should work with child loggers having custom levels', () => {
    const parentLogger = new Logger({
      level: 'info',
      customLevels: {
        'parent_custom': 6,
      },
      customColors: {
        'parent_custom': 'blue',
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    const childLogger = parentLogger.createChild({
      customLevels: {
        'child_custom': 7,  // Add child-specific level
      },
      customColors: {
        'child_custom': 'red',
      }
    });

    childLogger.logWithLevel('parent_custom', 'Parent custom level');
    childLogger.logWithLevel('child_custom', 'Child custom level');

    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe('parent_custom');
    expect(logs[1].level).toBe('child_custom');
  });
});