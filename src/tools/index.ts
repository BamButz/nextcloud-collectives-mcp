import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OcsClient } from "../nextcloud/ocsClient.js";
import { WebdavClient } from "../nextcloud/webdavClient.js";
import type { Config } from "../config.js";
import { createCollectivesTools } from "./collectives.js";
import { createPagesTools } from "./pages.js";
import { createTagsTools } from "./tags.js";
import { toToolResult } from "./toolResult.js";

export function registerTools(server: McpServer, config: Config, davUserId: string): void {
  const ocs = new OcsClient(config);
  const webdav = new WebdavClient(config, davUserId);

  const collectives = createCollectivesTools(ocs);
  const pages = createPagesTools(ocs, webdav);
  const tags = createTagsTools(ocs);

  server.registerTool(
    "list_collectives",
    {
      description: "List all Collectives (team wikis) visible to the authenticated user",
      inputSchema: {},
    },
    () => toToolResult(() => collectives.listCollectives()),
  );

  server.registerTool(
    "create_collective",
    {
      description: "Create a new Collective",
      inputSchema: { name: z.string().describe("Name of the new collective") },
    },
    (args) => toToolResult(() => collectives.createCollective(args)),
  );

  server.registerTool(
    "delete_collective",
    {
      description: "Move a Collective to the trash",
      inputSchema: { collectiveId: z.number().describe("ID of the collective") },
    },
    (args) => toToolResult(() => collectives.deleteCollective(args)),
  );

  server.registerTool(
    "list_pages",
    {
      description: "List the full page tree (metadata only, no content) of a Collective",
      inputSchema: { collectiveId: z.number().describe("ID of the collective") },
    },
    (args) => toToolResult(() => pages.listPages(args)),
  );

  server.registerTool(
    "get_page",
    {
      description: "Get a page's metadata and markdown content",
      inputSchema: {
        collectiveId: z.number().describe("ID of the collective"),
        pageId: z.number().describe("ID of the page"),
      },
    },
    (args) => toToolResult(() => pages.getPage(args)),
  );

  server.registerTool(
    "create_page",
    {
      description: "Create a new page under a parent page in a Collective",
      inputSchema: {
        collectiveId: z.number().describe("ID of the collective"),
        parentId: z.number().describe("ID of the parent page (0 for the top-level index page)"),
        title: z.string().describe("Title of the new page"),
        content: z.string().optional().describe("Initial markdown content for the page"),
      },
    },
    (args) => toToolResult(() => pages.createPage(args)),
  );

  server.registerTool(
    "update_page_content",
    {
      description: "Replace the markdown content of a page",
      inputSchema: {
        collectiveId: z.number().describe("ID of the collective"),
        pageId: z.number().describe("ID of the page"),
        content: z.string().describe("New markdown content"),
      },
    },
    (args) => toToolResult(() => pages.updatePageContent(args)),
  );

  server.registerTool(
    "rename_page",
    {
      description: "Rename a page",
      inputSchema: {
        collectiveId: z.number().describe("ID of the collective"),
        pageId: z.number().describe("ID of the page"),
        title: z.string().describe("New title"),
      },
    },
    (args) => toToolResult(() => pages.renamePage(args)),
  );

  server.registerTool(
    "move_page",
    {
      description: "Move a page to a new parent page, optionally at a specific index",
      inputSchema: {
        collectiveId: z.number().describe("ID of the collective"),
        pageId: z.number().describe("ID of the page"),
        newParentId: z.number().describe("ID of the new parent page"),
        index: z.number().optional().describe("Position among the new siblings"),
      },
    },
    (args) => toToolResult(() => pages.movePage(args)),
  );

  server.registerTool(
    "delete_page",
    {
      description: "Move a page to the trash",
      inputSchema: {
        collectiveId: z.number().describe("ID of the collective"),
        pageId: z.number().describe("ID of the page"),
      },
    },
    (args) => toToolResult(() => pages.deletePage(args)),
  );

  server.registerTool(
    "list_tags",
    {
      description: "List all tags defined in a Collective",
      inputSchema: { collectiveId: z.number().describe("ID of the collective") },
    },
    (args) => toToolResult(() => tags.listTags(args)),
  );

  server.registerTool(
    "create_tag",
    {
      description: "Create a new tag in a Collective",
      inputSchema: {
        collectiveId: z.number().describe("ID of the collective"),
        name: z.string().describe("Name of the tag"),
        color: z.string().optional().describe("Hex color, e.g. ff0000"),
      },
    },
    (args) => toToolResult(() => tags.createTag(args)),
  );

  server.registerTool(
    "add_tag_to_page",
    {
      description: "Attach an existing tag to a page",
      inputSchema: {
        collectiveId: z.number().describe("ID of the collective"),
        pageId: z.number().describe("ID of the page"),
        tagId: z.number().describe("ID of the tag"),
      },
    },
    (args) => toToolResult(() => tags.addTagToPage(args)),
  );

  server.registerTool(
    "remove_tag_from_page",
    {
      description: "Detach a tag from a page",
      inputSchema: {
        collectiveId: z.number().describe("ID of the collective"),
        pageId: z.number().describe("ID of the page"),
        tagId: z.number().describe("ID of the tag"),
      },
    },
    (args) => toToolResult(() => tags.removeTagFromPage(args)),
  );
}
