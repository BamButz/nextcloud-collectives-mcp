import type { OcsClient } from "../nextcloud/ocsClient.js";
import type { Collective } from "../nextcloud/types.js";

export function createCollectivesTools(ocs: OcsClient) {
  return {
    async listCollectives(): Promise<Collective[]> {
      const { collectives } = await ocs.get<{ collectives: Collective[] }>("/collectives");
      return collectives;
    },

    async createCollective(args: { name: string }): Promise<Collective> {
      const { collective } = await ocs.post<{ collective: Collective }>("/collectives", {
        name: args.name,
      });
      return collective;
    },

    async deleteCollective(args: { collectiveId: number }): Promise<Collective> {
      const { collective } = await ocs.delete<{ collective: Collective }>(
        `/collectives/${args.collectiveId}`,
      );
      return collective;
    },
  };
}
