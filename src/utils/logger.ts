import winston from "winston";

// Create logs directory if it doesn't exist
const fs = require("fs");
const path = require("path");
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "gfd-api" },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to `combined.log`
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({
          all: true,
          colors: {
            error: "red",
            warn: "yellow",
            info: "cyan",
            debug: "green",
          },
        }),
        winston.format.timestamp({
          format: "HH:mm:ss",
        }),
        winston.format.printf(
          ({ timestamp, level, message, service, ...meta }) => {
            // Add symbols for different log levels
            const symbols = {
              error: "❌",
              warn: "⚠️ ",
              info: "🔵",
              debug: "🐛",
            };

            // Get the symbol for the current level (remove color codes for matching)
            const levelKey = level.replace(/\x1b\[[0-9;]*m/g, "").toLowerCase();
            const symbol = symbols[levelKey as keyof typeof symbols] || "📝";

            // Format metadata nicely if it exists
            const metaStr = Object.keys(meta).length
              ? `\n   📋 ${JSON.stringify(meta, null, 2)
                  .split("\n")
                  .join("\n   ")}`
              : "";

            return `${symbol} ${timestamp} [${service}] ${level}: ${message}${metaStr}`;
          }
        )
      ),
    })
  );
}

// Create a stream object for Morgan
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
