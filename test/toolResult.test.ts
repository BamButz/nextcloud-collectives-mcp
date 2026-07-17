import { describe, expect, test } from "vitest";
import { toToolResult } from "../src/tools/toolResult.js";
import { OcsError } from "../src/nextcloud/ocsClient.js";
import { WebdavError } from "../src/nextcloud/webdavClient.js";

describe("toToolResult", () => {
  test("wraps a successful JSON-serializable result as text content", async () => {
    const result = await toToolResult(async () => ({ id: 1, name: "Engineering" }));

    expect(result.isError).toBeFalsy();
    expect(result.content).toEqual([
      { type: "text", text: JSON.stringify({ id: 1, name: "Engineering" }, null, 2) },
    ]);
  });

  test("wraps undefined results as a plain success message", async () => {
    const result = await toToolResult(async () => undefined);

    expect(result.isError).toBeFalsy();
    expect(result.content).toEqual([{ type: "text", text: "OK" }]);
  });

  test("marks OcsError as an error result with its message", async () => {
    const result = await toToolResult(async () => {
      throw new OcsError("Collective not found", 404);
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: "text", text: "Collective not found" }]);
  });

  test("marks WebdavError as an error result with its message", async () => {
    const result = await toToolResult(async () => {
      throw new WebdavError("File is locked", 423);
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: "text", text: "File is locked" }]);
  });

  test("marks unexpected errors as an error result with a generic message", async () => {
    const result = await toToolResult(async () => {
      throw new Error("boom");
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: "text", text: "boom" }]);
  });
});
