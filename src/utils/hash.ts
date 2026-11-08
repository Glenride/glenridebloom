import { createHash } from "node:crypto";

export const hashString = (input: string): string =>
  createHash("sha1").update(input).digest("hex");
