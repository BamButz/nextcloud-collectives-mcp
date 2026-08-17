import type { OcsClient } from "../nextcloud/ocsClient.js";
import type { WebdavClient } from "../nextcloud/webdavClient.js";
import type { PageInfo } from "../nextcloud/types.js";
import { resolvePageFilePath } from "../nextcloud/pagePath.js";

export function createPagesTools(ocs: OcsClient, webdav: WebdavClient) {
  const pathCache = new Map<string, string>();
  return {
    async listPages(args: { collectiveId: number }): Promise<PageInfo[]> {
      const { pages } = await ocs.get<{ pages: PageInfo[] }>(
        `/collectives/${args.collectiveId}/pages`,
      );
      for (const page of pages) {
        pathCache.set(`${args.collectiveId}:${page.id}`, resolvePageFilePath(page));
      }
      return pages;
    },

    async getPage(args: {
      collectiveId: number;
      pageId: number;
    }): Promise<PageInfo & { content: string }> {
      const { page } = await ocs.get<{ page: PageInfo }>(
        `/collectives/${args.collectiveId}/pages/${args.pageId}`,
      );
      pathCache.set(`${args.collectiveId}:${page.id}`, resolvePageFilePath(page));
      const content = await webdav.getContent(resolvePageFilePath(page));
      return { ...page, content };
    },

    async createPage(args: {
      collectiveId: number;
      parentId: number;
      title: string;
      content?: string;
    }): Promise<PageInfo> {
      const { page } = await ocs.post<{ page: PageInfo }>(
        `/collectives/${args.collectiveId}/pages/${args.parentId}`,
        { title: args.title },
      );
      pathCache.set(`${args.collectiveId}:${page.id}`, resolvePageFilePath(page));
      if (args.content !== undefined) {
        await webdav.putContent(resolvePageFilePath(page), args.content);
      }
      return page;
    },

    async updatePageContent(args: {
      collectiveId: number;
      pageId: number;
      content: string;
    }): Promise<void> {
      const cacheKey = `${args.collectiveId}:${args.pageId}`;
      let filePath = pathCache.get(cacheKey);
      if (!filePath) {
        const { page } = await ocs.get<{ page: PageInfo }>(
          `/collectives/${args.collectiveId}/pages/${args.pageId}`,
        );
        filePath = resolvePageFilePath(page);
        pathCache.set(cacheKey, filePath);
      }
      await webdav.putContent(filePath, args.content);
    },

    async renamePage(args: {
      collectiveId: number;
      pageId: number;
      title: string;
    }): Promise<PageInfo> {
      const { page } = await ocs.put<{ page: PageInfo }>(
        `/collectives/${args.collectiveId}/pages/${args.pageId}`,
        { title: args.title },
      );
      for (const key of pathCache.keys()) {
        if (key.startsWith(`${args.collectiveId}:`)) {
          pathCache.delete(key);
        }
      }
      return page;
    },

    async movePage(args: {
      collectiveId: number;
      pageId: number;
      newParentId: number;
      index?: number;
    }): Promise<PageInfo> {
      const { page } = await ocs.put<{ page: PageInfo }>(
        `/collectives/${args.collectiveId}/pages/${args.pageId}`,
        {
          parentId: args.newParentId,
          ...(args.index !== undefined ? { index: args.index } : {}),
        },
      );
      for (const key of pathCache.keys()) {
        if (key.startsWith(`${args.collectiveId}:`)) {
          pathCache.delete(key);
        }
      }
      return page;
    },

    async deletePage(args: { collectiveId: number; pageId: number }): Promise<PageInfo> {
      const { page } = await ocs.delete<{ page: PageInfo }>(
        `/collectives/${args.collectiveId}/pages/${args.pageId}`,
      );
      for (const key of pathCache.keys()) {
        if (key.startsWith(`${args.collectiveId}:`)) {
          pathCache.delete(key);
        }
      }
      return page;
    },
  };
}
