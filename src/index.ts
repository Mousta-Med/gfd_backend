import express, { Request, Response } from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

// Initialize dotenv
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingVars.join(", ")}`
  );
  console.error(
    "Please check your .env file and ensure all required variables are set."
  );
  process.exit(1);
}

console.log("✅ Environment variables validated successfully");

// Configuration constants
const REDIRECT_URI =
  process.env.GITHUB_REDIRECT_URI ||
  "http://localhost:3000/integrations/github/oauth2/callback";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

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

// Basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.post("/api/oauth-token", async (req: Request, res: Response) => {
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
    console.error("OAuth error:", error);
    res.status(500).json({ error: "Failed to obtain access token" });
  }
});

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
      console.error("GitHub API error:", error.response?.data || error.message);
      throw new Error("GitHub authentication failed");
    }
    throw error;
  }
}

app.get("/", (req: Request, res: Response) => {
  res.send("Works good and running!");
});

app.listen(port, () => {
  console.log(`Server running at : http://localhost:${port}`);
});
