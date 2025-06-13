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

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
  const res = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: `http://localhost:3000/integrations/github/oauth2/callback`,
    },
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  return res.data.access_token;
}

app.get("/", (req: Request, res: Response) => {
  res.send("Works good and running!");
});

app.listen(port, () => {
  console.log(`Server running at : http://localhost:${port}`);
});
