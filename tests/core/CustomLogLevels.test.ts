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

  test('should handle custom levels with same priority as built-in levels', () => {
    logger = new Logger({
      level: 'info',  // Priority 3
      customLevels: {
        'custom_info': 3,  // Same priority as info
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('custom_info', 'Custom info message');
    logger.info('Regular info message');

    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe('custom_info');
    expect(logs[1].level).toBe('info');
  });

  test('should handle custom levels with decimal priorities', () => {
    logger = new Logger({
      level: 'warn',  // Priority 4
      customLevels: {
        'between': 4.5,  // Between warn (4) and error (5)
        'lower': 3.5,    // Between info (3) and warn (4), won't appear
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('lower', 'Lower message');  // Should not appear
    logger.logWithLevel('between', 'Between message');  // Should appear
    logger.error('Error message');  // Should appear

    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe('between');
    expect(logs[1].level).toBe('error');
  });

  test('should handle custom levels with very high priorities', () => {
    logger = new Logger({
      level: 'info',  // Priority 3
      customLevels: {
        'critical': 100,
        'emergency': 999,
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('critical', 'Critical message');
    logger.logWithLevel('emergency', 'Emergency message');
    logger.debug('Debug message');  // Should not appear (2 < 3)

    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe('critical');
    expect(logs[1].level).toBe('emergency');
  });

  test('should handle custom levels with zero priority', () => {
    logger = new Logger({
      level: 'debug',  // Priority 2
      customLevels: {
        'trace': 0,  // Very low priority
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('trace', 'Trace message');  // Should not appear (0 < 2)
    logger.debug('Debug message');  // Should appear

    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('debug');
  });

  test('should handle custom levels with negative priorities', () => {
    logger = new Logger({
      level: 'info',  // Priority 3
      customLevels: {
        'ultra_trace': -1,  // Negative priority
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('ultra_trace', 'Ultra trace message');  // Should not appear
    logger.info('Info message');  // Should appear

    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('info');
  });

  test('should override built-in level colors with custom colors', () => {
    logger = new Logger({
      level: 'debug',
      colorize: true,
      customColors: {
        'error': 'blue',  // Override built-in error color
        'info': 'magenta',  // Override built-in info color
      },
      transports: [
        { type: 'console', options: { colorize: true } }
      ]
    });

    // Verify the logger doesn't crash with overridden colors
    expect(() => {
      logger.error('Error in blue');
      logger.info('Info in magenta');
    }).not.toThrow();
  });

  test('should handle custom colors without corresponding custom levels', () => {
    logger = new Logger({
      level: 'info',
      customColors: {
        'nonexistent': 'purple',  // Color for level that doesn't exist
      },
      transports: [
        { type: 'console', options: { colorize: true } }
      ]
    });

    // Should not crash even though the level doesn't exist
    expect(() => {
      logger.info('Info message');
    }).not.toThrow();
  });

  test('should handle multiple custom levels at same priority boundary', () => {
    logger = new Logger({
      level: 'warn',  // Priority 4
      customLevels: {
        'alert': 4,
        'notice': 4,
        'custom': 4,
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('alert', 'Alert message');
    logger.logWithLevel('notice', 'Notice message');
    logger.logWithLevel('custom', 'Custom message');

    expect(logs.length).toBe(3);
    expect(logs[0].level).toBe('alert');
    expect(logs[1].level).toBe('notice');
    expect(logs[2].level).toBe('custom');
  });

  test('should support setting logger level to custom level', () => {
    logger = new Logger({
      level: 'custom_threshold',  // Set to custom level
      customLevels: {
        'custom_threshold': 5,
        'above_threshold': 6,
        'below_threshold': 4,
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('below_threshold', 'Below');  // Should not appear
    logger.logWithLevel('custom_threshold', 'At threshold');  // Should appear
    logger.logWithLevel('above_threshold', 'Above');  // Should appear

    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe('custom_threshold');
    expect(logs[1].level).toBe('above_threshold');
  });

  test('should handle empty custom levels object', () => {
    logger = new Logger({
      level: 'info',
      customLevels: {},
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.info('Info message');
    logger.error('Error message');

    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe('info');
    expect(logs[1].level).toBe('error');
  });

  test('should handle custom level names with special characters', () => {
    logger = new Logger({
      level: 'info',
      customLevels: {
        'api-error': 6,
        'db_query': 4,
        'http.request': 3,
      },
      customColors: {
        'api-error': 'red',
        'db_query': 'cyan',
        'http.request': 'yellow',
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('api-error', 'API error');
    logger.logWithLevel('db_query', 'DB query');
    logger.logWithLevel('http.request', 'HTTP request');

    expect(logs.length).toBe(3);
    expect(logs[0].level).toBe('api-error');
    expect(logs[1].level).toBe('db_query');
    expect(logs[2].level).toBe('http.request');
  });

  test('should handle custom levels in async mode', async () => {
    logger = new Logger({
      level: 'info',
      async: true,
      customLevels: {
        'async_custom': 5,
      },
      customColors: {
        'async_custom': 'magenta',
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('async_custom', 'Async custom message');
    logger.info('Async info message');

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe('async_custom');
    expect(logs[1].level).toBe('info');
  });

  test('should filter custom levels correctly when level changes', () => {
    logger = new Logger({
      level: 'info',  // Priority 3
      customLevels: {
        'low': 2,
        'high': 5,
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('low', 'Low 1');  // Should not appear
    logger.logWithLevel('high', 'High 1');  // Should appear

    logs = [];  // Clear logs
    logger.setLevel('debug');  // Priority 2

    logger.logWithLevel('low', 'Low 2');  // Now should appear
    logger.logWithLevel('high', 'High 2');  // Should still appear

    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe('low');
    expect(logs[1].level).toBe('high');
  });

  test('should handle metadata with custom levels', () => {
    logger = new Logger({
      level: 'info',
      customLevels: {
        'metric': 4,
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    logger.logWithLevel('metric', 'Performance metric', {
      duration: 123,
      endpoint: '/api/users',
    });

    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('metric');
    expect(logs[0].message).toBe('Performance metric');
    expect(logs[0].metadata).toEqual({
      duration: 123,
      endpoint: '/api/users',
    });
  });

  test('child logger should correctly filter custom levels inherited from parent', () => {
    const parentLogger = new Logger({
      level: 'info',  // Priority 3
      customLevels: {
        'parent_low': 2,
        'parent_high': 5,
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    const childLogger = parentLogger.createChild({
      level: 'parent_low',  // Lower threshold
    });

    childLogger.logWithLevel('parent_low', 'Parent low');  // Should appear
    childLogger.logWithLevel('parent_high', 'Parent high');  // Should appear

    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe('parent_low');
    expect(logs[1].level).toBe('parent_high');
  });

  test('should handle unknown custom level gracefully', () => {
    logger = new Logger({
      level: 'info',
      customLevels: {
        'known': 5,
      },
      transports: [
        { type: 'custom', instance: createTestTransport() }
      ]
    });

    // Try to log with a level not defined in customLevels
    logger.logWithLevel('unknown' as any, 'Unknown level message');

    // Should log with default high priority (999)
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('unknown');
  });
});