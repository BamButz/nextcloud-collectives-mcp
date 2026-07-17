import type { OcsClient } from "../nextcloud/ocsClient.js";
import type { PageInfo, Tag } from "../nextcloud/types.js";

export function createTagsTools(ocs: OcsClient) {
  return {
    async listTags(args: { collectiveId: number }): Promise<Tag[]> {
      const { tags } = await ocs.get<{ tags: Tag[] }>(`/collectives/${args.collectiveId}/tags`);
      return tags;
    },

    async createTag(args: { collectiveId: number; name: string; color?: string }): Promise<Tag> {
      const { tag } = await ocs.post<{ tag: Tag }>(`/collectives/${args.collectiveId}/tags`, {
        name: args.name,
        ...(args.color !== undefined ? { color: args.color } : {}),
      });
      return tag;
    },

    async addTagToPage(args: {
      collectiveId: number;
      pageId: number;
      tagId: number;
    }): Promise<PageInfo> {
      const { page } = await ocs.put<{ page: PageInfo }>(
        `/collectives/${args.collectiveId}/pages/${args.pageId}/tags/${args.tagId}`,
      );
      return page;
    },

    async removeTagFromPage(args: {
      collectiveId: number;
      pageId: number;
      tagId: number;
    }): Promise<PageInfo> {
      const { page } = await ocs.delete<{ page: PageInfo }>(
        `/collectives/${args.collectiveId}/pages/${args.pageId}/tags/${args.tagId}`,
      );
      return page;
    },
  };
}
