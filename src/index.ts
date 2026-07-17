#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { fetchCurrentUserId } from "./nextcloud/currentUser.js";
import { registerTools } from "./tools/index.js";

const config = loadConfig(process.env);
const davUserId = await fetchCurrentUserId(config);

const server = new McpServer({
  name: "nextcloud-collectives-mcp",
  version: "1.0.0",
});

registerTools(server, config, davUserId);

const transport = new StdioServerTransport();
await server.connect(transport);
