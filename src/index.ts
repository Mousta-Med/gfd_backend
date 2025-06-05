import express, { Request, Response } from "express";
import axios from "axios";
import { get } from "http";

const app = express();
const port = process.env.PORT || 3001;
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.post("/api/oauth-token", (req: Request, res: Response) => {
  let { code } = req.body;
  const token = getAccessToken(code);
  res.status(200).send("Token received: " + token);
});

async function getAccessToken(code: string) {
  const res = await axios.get("https://github.com/login/oauth/access_token", {
    params: {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: `http://localhost:3000/integrations/github/oauth2/callback`,
    },
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "application/json",
    },
  });

  return res.data.access_token;
}

app.get("/", (req: Request, res: Response) => {
  res.send("Works good");
});

app.listen(port, () => {
  console.log(`Server running at : http://localhost:${port}`);
});
