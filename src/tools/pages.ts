import type { OcsClient } from "../nextcloud/ocsClient.js";
import type { WebdavClient } from "../nextcloud/webdavClient.js";
import type { PageInfo } from "../nextcloud/types.js";
import { resolvePageFilePath } from "../nextcloud/pagePath.js";

export function createPagesTools(ocs: OcsClient, webdav: WebdavClient) {
  return {
    async listPages(args: { collectiveId: number }): Promise<PageInfo[]> {
      const { pages } = await ocs.get<{ pages: PageInfo[] }>(
        `/collectives/${args.collectiveId}/pages`,
      );
      return pages;
    },

    async getPage(args: {
      collectiveId: number;
      pageId: number;
    }): Promise<PageInfo & { content: string }> {
      const { page } = await ocs.get<{ page: PageInfo }>(
        `/collectives/${args.collectiveId}/pages/${args.pageId}`,
      );
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
      const { page } = await ocs.get<{ page: PageInfo }>(
        `/collectives/${args.collectiveId}/pages/${args.pageId}`,
      );
      await webdav.putContent(resolvePageFilePath(page), args.content);
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
      return page;
    },

    async deletePage(args: { collectiveId: number; pageId: number }): Promise<PageInfo> {
      const { page } = await ocs.delete<{ page: PageInfo }>(
        `/collectives/${args.collectiveId}/pages/${args.pageId}`,
      );
      return page;
    },
  };
}
