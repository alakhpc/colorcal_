import { MinAccessRole } from "./schemas";

export type CalendarListParams = {
  maxResults?: number;
  minAccessRole?: MinAccessRole;
  pageToken?: string;
  showDeleted?: boolean;
  showHidden?: boolean;
  syncToken?: string;
};
