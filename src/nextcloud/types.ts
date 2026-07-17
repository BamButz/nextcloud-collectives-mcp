export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface Collective {
  id: number;
  name: string;
  slug?: string;
  emoji?: string | null;
  level: number;
  permissions: number;
  canEdit: boolean;
  canShare: boolean;
  editPermissionLevel: number;
  sharePermissionLevel: number;
  trashTimestamp?: number | null;
  pageMode?: number;
  circleUniqueId?: string;
}

export interface PageInfo {
  id: number;
  parentId: number;
  title: string;
  emoji?: string | null;
  fileName: string;
  filePath: string;
  collectivePath: string;
  slug?: string;
  lastUserId?: string;
  lastUserDisplayName?: string;
  timestamp?: number;
  size?: number;
  fullWidth?: boolean;
  subpageOrder?: number[] | null;
  tags?: number[];
  trashTimestamp?: number | null;
  shareToken?: string | null;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
}
