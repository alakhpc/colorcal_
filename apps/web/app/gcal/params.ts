import { MinAccessRole } from "./schemas";

export type PostParams = {
  path: string;
  params?: Record<string, string | number | boolean>;
  body?: unknown;
};

export type CalendarListParams = {
  maxResults?: number;
  minAccessRole?: MinAccessRole;
  pageToken?: string;
  showDeleted?: boolean;
  showHidden?: boolean;
  syncToken?: string;
};
