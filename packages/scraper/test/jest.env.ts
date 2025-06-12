// loads .env from repo root *before* anything else
import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../../../.env") }); 