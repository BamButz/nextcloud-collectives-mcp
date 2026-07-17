import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { WebdavClient, WebdavError } from "../src/nextcloud/webdavClient.js";

const BASE_URL = "https://cloud.example.com";
const DAV_PREFIX = "/remote.php/dav/files/alice";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeClient() {
  return new WebdavClient({
    baseUrl: BASE_URL,
    username: "alice",
    appPassword: "secret-app-password",
  });
}

describe("WebdavClient", () => {
  test("getContent sends Basic Auth and returns the response body as text", async () => {
    let capturedAuth: string | null = null;

    server.use(
      http.get(`${BASE_URL}${DAV_PREFIX}/Collectives/Engineering/Readme.md`, ({ request }) => {
        capturedAuth = request.headers.get("authorization");
        return HttpResponse.text("# Hello world");
      }),
    );

    const client = makeClient();
    const content = await client.getContent("Collectives/Engineering/Readme.md");

    expect(content).toBe("# Hello world");
    expect(capturedAuth).toBe(
      `Basic ${Buffer.from("alice:secret-app-password").toString("base64")}`,
    );
  });

  test("putContent sends the markdown body via PUT", async () => {
    let capturedBody: string | null = null;
    let capturedMethod: string | null = null;

    server.use(
      http.put(`${BASE_URL}${DAV_PREFIX}/Collectives/Engineering/Readme.md`, async ({ request }) => {
        capturedMethod = request.method;
        capturedBody = await request.text();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const client = makeClient();
    await client.putContent("Collectives/Engineering/Readme.md", "# Updated content");

    expect(capturedMethod).toBe("PUT");
    expect(capturedBody).toBe("# Updated content");
  });

  test("getContent throws WebdavError with a clear message on 404", async () => {
    server.use(
      http.get(`${BASE_URL}${DAV_PREFIX}/Collectives/Missing/Readme.md`, () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    const client = makeClient();

    await expect(client.getContent("Collectives/Missing/Readme.md")).rejects.toThrow(
      WebdavError,
    );
    await expect(client.getContent("Collectives/Missing/Readme.md")).rejects.toThrow(
      /not found/i,
    );
  });

  test("putContent throws WebdavError with a clear message on 423 locked", async () => {
    server.use(
      http.put(`${BASE_URL}${DAV_PREFIX}/Collectives/Engineering/Readme.md`, () => {
        return new HttpResponse(null, { status: 423 });
      }),
    );

    const client = makeClient();

    await expect(
      client.putContent("Collectives/Engineering/Readme.md", "content"),
    ).rejects.toThrow(/locked/i);
  });

  test("uses a separate DAV user id for the path while keeping the login name for Basic Auth", async () => {
    // On LDAP/SSO-backed instances, the WebDAV principal is the internal Nextcloud
    // user id (often a GUID), which differs from the login name used for auth.
    const davUserId = "11111111-2222-3333-4444-555555555555";
    let capturedAuth: string | null = null;

    server.use(
      http.get(`${BASE_URL}/remote.php/dav/files/${davUserId}/Collectives/Engineering/Readme.md`, ({ request }) => {
        capturedAuth = request.headers.get("authorization");
        return HttpResponse.text("# Hello world");
      }),
    );

    const client = new WebdavClient(
      { baseUrl: BASE_URL, username: "alice", appPassword: "secret-app-password" },
      davUserId,
    );
    const content = await client.getContent("Collectives/Engineering/Readme.md");

    expect(content).toBe("# Hello world");
    expect(capturedAuth).toBe(
      `Basic ${Buffer.from("alice:secret-app-password").toString("base64")}`,
    );
  });
});
