import type { Config } from "../config.js";
import type { JsonValue } from "./types.js";

const API_PREFIX = "/ocs/v2.php/apps/collectives/api/v1.0";

export class OcsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "OcsError";
  }
}

interface OcsEnvelope<T> {
  ocs: {
    meta: { status: string; statuscode: number; message: string };
    data: T;
  };
}

export class OcsClient {
  constructor(private readonly config: Config) {}

  private authHeader(): string {
    const token = Buffer.from(`${this.config.username}:${this.config.appPassword}`).toString(
      "base64",
    );
    return `Basic ${token}`;
  }

  private async request<T>(method: string, path: string, body?: JsonValue): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${API_PREFIX}${path}`, {
      method,
      headers: {
        Authorization: this.authHeader(),
        "OCS-APIRequest": "true",
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const envelope = (await response.json()) as OcsEnvelope<T>;

    if (!response.ok) {
      throw new OcsError(envelope.ocs.meta.message, response.status);
    }

    return envelope.ocs.data;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: JsonValue): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  put<T>(path: string, body?: JsonValue): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  patch<T>(path: string, body?: JsonValue): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }
}
