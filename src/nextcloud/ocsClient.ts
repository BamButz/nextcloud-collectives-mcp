import type { Config } from "../config.js";
import type { JsonValue } from "./types.js";
import { getBasicAuthHeader } from "./auth.js";

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
  private readonly cachedAuthHeader: string;

  constructor(private readonly config: Config) {
    this.cachedAuthHeader = getBasicAuthHeader(this.config);
  }

  private authHeader(): string {
    return this.cachedAuthHeader;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: JsonValue,
  ): Promise<T> {
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

    let envelope: OcsEnvelope<T> | undefined;

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        envelope = (await response.json()) as OcsEnvelope<T>;
      } catch {
        // Failed to parse JSON, handled below
      }
    }

    if (!response.ok) {
      const message = envelope?.ocs?.meta?.message || `HTTP Error ${response.status}: ${response.statusText}`;
      throw new OcsError(message, response.status);
    }

    if (!envelope || !envelope.ocs || envelope.ocs.data === undefined) {
      throw new OcsError("Invalid or missing JSON response from server", response.status);
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
