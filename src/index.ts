import express, { Request, Response } from "express";

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.post("/api/oauth-token", (req: Request, res: Response) => {
  res.send(req.body);
});

app.get("/", (req: Request, res: Response) => {
  res.send("Works good and running!");
});

app.listen(port, () => {
  console.log(`Server running at : http://localhost:${port}`);
});
