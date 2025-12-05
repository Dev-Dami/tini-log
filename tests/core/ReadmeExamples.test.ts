import { Logger } from "../../src";
import { LogData } from "../../src/types";

/**
 * Tests to validate code examples from README.md work correctly
 * These tests ensure documentation stays in sync with actual implementation
 */
describe("README.md - Custom Levels & Colors Examples", () => {
  let logs: LogData[] = [];

  const createTestTransport = () => ({
    write: (data: LogData) => {
      logs.push(data);
    },
    writeAsync: async (data: LogData) => {
      logs.push(data);
    },
  });

  beforeEach(() => {
    logs = [];
  });

  describe("Define Custom Log Levels Example", () => {
    test("should work as documented in README", () => {
      // This is the exact example from README.md
      const logger = new Logger({
        level: "info",
        customLevels: {
          success: 6, // Higher priority than error (5).
          verbose: 1, // Lower priority than debug (2).
          critical: 7, // Highest priority.
        },
        customColors: {
          success: "green",
          verbose: "cyan",
          critical: "brightRed",
        },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      // Using custom levels.
      logger.logWithLevel("success", "This is a success message in green!");
      logger.logWithLevel("verbose", "This is a verbose message in cyan");
      logger.logWithLevel(
        "critical",
        "This is a critical message in bright red",
      );

      // Verify 2 logs were created (verbose won't appear because its priority 1 is < info's priority 3)
      expect(logs.length).toBe(2);
      expect(logs[0].level).toBe("success");
      expect(logs[0].message).toBe("This is a success message in green!");
      expect(logs[1].level).toBe("critical");
      expect(logs[1].message).toBe("This is a critical message in bright red");
    });

    test("should properly filter based on custom level priorities", () => {
      const logger = new Logger({
        level: "info", // priority 3
        customLevels: {
          success: 6,
          verbose: 1,
          critical: 7,
        },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      logger.logWithLevel("verbose", "Should not appear"); // priority 1 < 3
      logger.logWithLevel("success", "Should appear"); // priority 6 > 3
      logger.logWithLevel("critical", "Should appear"); // priority 7 > 3

      expect(logs.length).toBe(2);
      expect(logs[0].level).toBe("success");
      expect(logs[1].level).toBe("critical");
    });
  });

  describe("Log Level Filtering Example", () => {
    test("should work as documented in README", () => {
      // Only logs levels with priority >= 7 (critical in this case).
      const highLevelLogger = new Logger({
        level: "critical",
        customLevels: {
          success: 6,
          verbose: 1,
          critical: 7,
        },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      // This will NOT be shown (verbose has priority 1 < critical threshold 7).
      highLevelLogger.logWithLevel("verbose", "This will not appear");

      // This WILL be shown (critical has priority 7 >= threshold 7).
      highLevelLogger.logWithLevel("critical", "This critical message appears");

      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe("critical");
      expect(logs[0].message).toBe("This critical message appears");
    });

    test("should correctly filter with success level below critical threshold", () => {
      const highLevelLogger = new Logger({
        level: "critical",
        customLevels: {
          success: 6,
          verbose: 1,
          critical: 7,
        },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      highLevelLogger.logWithLevel("success", "Should not appear"); // 6 < 7
      highLevelLogger.logWithLevel("critical", "Should appear"); // 7 >= 7

      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe("critical");
    });
  });

  describe("Child Logger with Custom Levels Example", () => {
    test("should work as documented in README", () => {
      const parentLogger = new Logger({
        level: "info",
        customLevels: {
          parent_custom: 6,
        },
        customColors: {
          parent_custom: "blue",
        },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      // Child will inherit parent's custom levels and can add its own.
      const childLogger = parentLogger.createChild({
        customLevels: {
          child_custom: 7, // Add child-specific level.
        },
        customColors: {
          child_custom: "red",
        },
      });

      childLogger.logWithLevel("parent_custom", "Inherited from parent");
      childLogger.logWithLevel("child_custom", "Defined in child");

      expect(logs.length).toBe(2);
      expect(logs[0].level).toBe("parent_custom");
      expect(logs[0].message).toBe("Inherited from parent");
      expect(logs[1].level).toBe("child_custom");
      expect(logs[1].message).toBe("Defined in child");
    });

    test("should verify child can use both inherited and own custom levels", () => {
      const parentLogger = new Logger({
        level: "info",
        customLevels: {
          parent_custom: 6,
        },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      const childLogger = parentLogger.createChild({
        customLevels: {
          child_custom: 7,
        },
      });

      // Both should work
      expect(() => {
        childLogger.logWithLevel("parent_custom", "Parent level");
        childLogger.logWithLevel("child_custom", "Child level");
      }).not.toThrow();

      expect(logs.length).toBe(2);
    });
  });

  describe("Custom Colors Integration", () => {
    test("should allow colors for custom levels", () => {
      const logger = new Logger({
        level: "info",
        customLevels: {
          success: 6,
          warning: 4,
          alert: 7,
        },
        customColors: {
          success: "green",
          warning: "yellow",
          alert: "red",
        },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      logger.logWithLevel("success", "Success message");
      logger.logWithLevel("warning", "Warning message");
      logger.logWithLevel("alert", "Alert message");

      expect(logs.length).toBe(3);
      expect(logs.map((l) => l.level)).toEqual(["success", "warning", "alert"]);
    });

    test("should work without colors specified", () => {
      const logger = new Logger({
        level: "info",
        customLevels: {
          custom1: 5,
          custom2: 6,
        },
        // No customColors specified
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      expect(() => {
        logger.logWithLevel("custom1", "Message 1");
        logger.logWithLevel("custom2", "Message 2");
      }).not.toThrow();

      expect(logs.length).toBe(2);
    });
  });

  describe("Edge Cases from Documentation", () => {
    test("should handle custom level with same priority as built-in level", () => {
      const logger = new Logger({
        level: "info",
        customLevels: {
          custom_info: 3, // Same as info
        },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      logger.info("Built-in info");
      logger.logWithLevel("custom_info", "Custom info level");

      expect(logs.length).toBe(2);
    });

    test("should handle fractional priorities", () => {
      const logger = new Logger({
        level: "info", // priority 3
        customLevels: {
          between_info_warn: 3.5, // Between info (3) and warn (4)
        },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      logger.logWithLevel("between_info_warn", "Between message");

      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe("between_info_warn");
    });

    test("should handle very high priority custom levels", () => {
      const logger = new Logger({
        level: "critical",
        customLevels: {
          critical: 100,
          ultra_critical: 200,
        },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      logger.logWithLevel("critical", "Critical message");
      logger.logWithLevel("ultra_critical", "Ultra critical message");

      expect(logs.length).toBe(2);
    });

    test("should handle negative priority custom levels", () => {
      const logger = new Logger({
        level: "info", // priority 3
        customLevels: {
          trace: -1,
          ultra_verbose: -10,
        },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      logger.logWithLevel("trace", "Should not appear"); // -1 < 3
      logger.logWithLevel("ultra_verbose", "Should not appear"); // -10 < 3
      logger.info("Should appear"); // 3 >= 3

      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe("info");
    });
  });

  describe("Regression Tests for mergedCColors Variable", () => {
    test("should correctly merge custom colors using mergedCColors variable", () => {
      // This specifically tests the variable rename from mergedCustomColors to mergedCColors
      const parent = new Logger({
        level: "info",
        customColors: {
          parent1: "blue",
          parent2: "green",
        },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      const child = parent.createChild({
        customColors: {
          child1: "red",
          parent1: "yellow", // Override parent
        },
      });

      const childFormatter = (child as any).formatter;
      const colors = childFormatter.getCustomColors();

      // Verify the merge worked correctly (this would fail if mergedCColors had issues)
      expect(colors["parent1"]).toBe("yellow"); // Child override
      expect(colors["parent2"]).toBe("green"); // Parent inherited
      expect(colors["child1"]).toBe("red"); // Child new
    });

    test("should handle multiple levels of inheritance with mergedCColors", () => {
      const level1 = new Logger({
        customColors: { l1: "c1" },
        transports: [{ type: "custom", instance: createTestTransport() }],
      });

      const level2 = level1.createChild({
        customColors: { l2: "c2" },
      });

      const level3 = level2.createChild({
        customColors: { l3: "c3" },
      });

      const level3Formatter = (level3 as any).formatter;
      const colors = level3Formatter.getCustomColors();

      expect(colors["l1"]).toBe("c1");
      expect(colors["l2"]).toBe("c2");
      expect(colors["l3"]).toBe("c3");
    });
  });
});
