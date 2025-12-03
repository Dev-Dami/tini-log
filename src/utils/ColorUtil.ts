export class ColorUtil {
  // ANSI color codes
  private static readonly ANSI_COLORS: { [key: string]: string } = {
    // Standard colors
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",

    // Bright colors
    brightRed: "\x1b[91m",
    brightGreen: "\x1b[92m",
    brightYellow: "\x1b[93m",
    brightBlue: "\x1b[94m",
    brightMagenta: "\x1b[95m",
    brightCyan: "\x1b[96m",
    brightWhite: "\x1b[97m",

    // Default log level colors
    info: "\x1b[32m",
    warn: "\x1b[33m",
    error: "\x1b[31m",
    debug: "\x1b[36m",
    boring: "\x1b[37m",
    reset: "\x1b[0m",
  };

  static colorize(text: string, color: string): string {
    const supportsColor =
      process.env.FORCE_COLOR !== "0" &&
      (process.stdout.isTTY || process.env.FORCE_COLOR === "1");

    if (!supportsColor) {
      return text;
    }

    const colorCode = ColorUtil.ANSI_COLORS[color] || ColorUtil.ANSI_COLORS.reset;
    return `${colorCode}${text}${ColorUtil.ANSI_COLORS.reset}`;
  }
}
