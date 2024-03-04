import { EventType } from "./schema";

export interface PostParams {
  path: string;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export interface WatchCalendarListParams {
  id: string;
  address: string;
}

export interface WatchCalendarListResponse {
  kind: "api#channel";
  id: string;
  resourceId: string;
  resourceUri: string;
  token?: string;
  expiration?: string;
}

export interface EventListParams {
  calendarId: string;

  alwaysIncludeEmail?: boolean;
  eventTypes?: EventType;
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
}

export interface MoveEventArgs {
  eventId: string;
  calendarId: string;
  destination: string;
}

export interface WatchEventsArgs {
  id: string;
  address: string;
  calendarId: string;
  eventTypes?: EventType;
}

export interface WatchEventsResponse {
  kind: "api#channel";
  id: string;
  resourceId: string;
  resourceUri: string;
  token?: string;
  expiration?: string;
}

export interface StopChannelArgs {
  id: string;
  resourceId: string;
}
