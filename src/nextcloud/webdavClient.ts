import type { Config } from "../config.js";

export class WebdavError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "WebdavError";
  }
}

function messageForStatus(status: number): string {
  switch (status) {
    case 404:
      return "File not found";
    case 423:
      return "File is locked";
    case 507:
      return "Insufficient storage";
    default:
      return `WebDAV request failed with status ${status}`;
  }
}

export class WebdavClient {
  private readonly davUserId: string;

  constructor(
    private readonly config: Config,
    davUserId?: string,
  ) {
    this.davUserId = davUserId ?? config.username;
  }

  private authHeader(): string {
    const token = Buffer.from(`${this.config.username}:${this.config.appPassword}`).toString(
      "base64",
    );
    return `Basic ${token}`;
  }

  private url(path: string): string {
    const encodedPath = path
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `${this.config.baseUrl}/remote.php/dav/files/${encodeURIComponent(this.davUserId)}/${encodedPath}`;
  }

  async getContent(path: string): Promise<string> {
    const response = await fetch(this.url(path), {
      method: "GET",
      headers: { Authorization: this.authHeader() },
    });

    if (!response.ok) {
      throw new WebdavError(messageForStatus(response.status), response.status);
    }

    return response.text();
  }

  async putContent(path: string, content: string): Promise<void> {
    const response = await fetch(this.url(path), {
      method: "PUT",
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "text/markdown",
      },
      body: content,
    });

    if (!response.ok) {
      throw new WebdavError(messageForStatus(response.status), response.status);
    }
  }
}
