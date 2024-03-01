import { MinAccessRole } from "./schema";

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

export type EventListParams = {
  calendarId: string;

  alwaysIncludeEmail?: boolean;
  eventTypes?: "default" | "focusTime" | "outOfOffice" | "workingLocation";
  iCalUID?: string;
  maxAttendees?: number;
  maxResults?: number;
  orderBy?: "startTime" | "updated";
  pageToken?: string;
  privateExtendedProperty?: string;
  q?: string;
  sharedExtendedProperty?: string;
  showDeleted?: boolean;
  showHiddenInvitations?: boolean;
  singleEvents?: boolean;
  syncToken?: string;
  timeMax?: string;
  timeMin?: string;
  timeZone?: string;
  updatedMin?: string;
};
