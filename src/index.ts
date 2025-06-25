import express, { Request, Response } from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import { logger, logStream } from "./utils/logger";
import {
  generalLimiter,
  oauthLimiter,
  healthCheckLimiter,
} from "./middleware/rateLimiter";

// Initialize dotenv
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error("Missing required environment variables", {
    missingVars,
    message:
      "Please check your .env file and ensure all required variables are set.",
  });
  process.exit(1);
}

logger.info("Environment variables validated successfully");

// Configuration constants
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;
const FRONTEND_URL = "https://happy-dune-07a825b03.6.azurestaticapps.net/";

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// HTTP request logging
app.use(morgan("combined", { stream: logStream }));

// Helmet's comprehensive security middleware
app.use(helmet());

// General rate limiting for all requests
app.use(generalLimiter);

app.post(
  "/api/oauth-token",
  oauthLimiter,
  async (req: Request, res: Response) => {
    try {
      let { code } = req.body;

      // Basic input validation
      if (!code || typeof code !== "string" || code.trim() === "") {
        res.status(400).json({
          error: "Invalid request",
          message: "Code parameter is required",
        });
      } else {
        const token = await getAccessToken(code);
        res.status(200).json({ access_token: token });
      }
    } catch (error) {
      logger.error("OAuth error occurred", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({ error: "Failed to obtain access token" });
    }
  }
);

async function getAccessToken(code: string) {
  try {
    const res = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI,
      },
      {
        headers: {
          Accept: "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    // Check if we received an access token
    if (!res.data.access_token) {
      throw new Error("No access token received from GitHub");
    }

    return res.data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error("GitHub API error", {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw new Error("GitHub authentication failed");
    }
    logger.error("Unexpected error in getAccessToken", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

app.get("/", healthCheckLimiter, (req: Request, res: Response) => {
  res.json({
    message: "GitHub OAuth API Server",
    status: "running",
    version: "1.0.0",
    endpoints: {
      oauth: "/api/oauth-token",
    },
  });
});

app.listen(port, () => {
  const startupMessage = `
🚀 Server started successfully!
📍 Port: ${port}
🌍 Environment: ${process.env.NODE_ENV || "development"}
🔗 URL: http://localhost:${port}
  `.trim();
  logger.info(startupMessage);
});
