import type { Config } from "../config.js";

export function getBasicAuthHeader(config: Config): string {
  const token = Buffer.from(
    `${config.username}:${config.appPassword}`,
  ).toString("base64");
  return `Basic ${token}`;
}
