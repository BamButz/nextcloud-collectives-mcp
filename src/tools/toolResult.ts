import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export async function toToolResult<T>(fn: () => Promise<T>): Promise<CallToolResult> {
  try {
    const result = await fn();
    const text = result === undefined ? "OK" : JSON.stringify(result, null, 2);
    return { content: [{ type: "text", text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { isError: true, content: [{ type: "text", text: message }] };
  }
}
