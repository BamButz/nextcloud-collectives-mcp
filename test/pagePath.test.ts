import { describe, expect, test } from "vitest";
import { resolvePageFilePath } from "../src/nextcloud/pagePath.js";

describe("resolvePageFilePath", () => {
  test("composes the path for a root page (empty filePath)", () => {
    const path = resolvePageFilePath({
      collectivePath: ".Kollektive/Engineering",
      filePath: "",
      fileName: "Readme.md",
    });

    expect(path).toBe(".Kollektive/Engineering/Readme.md");
  });

  test("composes the path for a page one level deep", () => {
    const path = resolvePageFilePath({
      collectivePath: ".Kollektive/Engineering",
      filePath: "Planning",
      fileName: "Phase1.md",
    });

    expect(path).toBe(".Kollektive/Engineering/Planning/Phase1.md");
  });

  test("composes the path for a page nested several levels deep", () => {
    const path = resolvePageFilePath({
      collectivePath: ".Kollektive/Engineering",
      filePath: "Planning/Phase1",
      fileName: "Readme.md",
    });

    expect(path).toBe(".Kollektive/Engineering/Planning/Phase1/Readme.md");
  });
});
