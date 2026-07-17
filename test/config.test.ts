import { describe, expect, test } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  test("loads config from a complete env", () => {
    const config = loadConfig({
      NEXTCLOUD_BASE_URL: "https://cloud.example.com",
      NEXTCLOUD_USERNAME: "alice",
      NEXTCLOUD_APP_PASSWORD: "secret-app-password",
    });

    expect(config).toEqual({
      baseUrl: "https://cloud.example.com",
      username: "alice",
      appPassword: "secret-app-password",
    });
  });

  test("strips a trailing slash from the base URL", () => {
    const config = loadConfig({
      NEXTCLOUD_BASE_URL: "https://cloud.example.com/",
      NEXTCLOUD_USERNAME: "alice",
      NEXTCLOUD_APP_PASSWORD: "secret-app-password",
    });

    expect(config.baseUrl).toBe("https://cloud.example.com");
  });

  test("throws a descriptive error when NEXTCLOUD_BASE_URL is missing", () => {
    expect(() =>
      loadConfig({
        NEXTCLOUD_USERNAME: "alice",
        NEXTCLOUD_APP_PASSWORD: "secret-app-password",
      }),
    ).toThrow(/NEXTCLOUD_BASE_URL/);
  });

  test("throws a descriptive error when NEXTCLOUD_USERNAME is missing", () => {
    expect(() =>
      loadConfig({
        NEXTCLOUD_BASE_URL: "https://cloud.example.com",
        NEXTCLOUD_APP_PASSWORD: "secret-app-password",
      }),
    ).toThrow(/NEXTCLOUD_USERNAME/);
  });

  test("throws a descriptive error when NEXTCLOUD_APP_PASSWORD is missing", () => {
    expect(() =>
      loadConfig({
        NEXTCLOUD_BASE_URL: "https://cloud.example.com",
        NEXTCLOUD_USERNAME: "alice",
      }),
    ).toThrow(/NEXTCLOUD_APP_PASSWORD/);
  });
});
