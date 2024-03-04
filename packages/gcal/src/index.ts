import { refreshAccessToken } from "@colorcal/auth/google";
import { Database } from "@colorcal/db";
import { eq } from "@colorcal/db/drizzle";
import { gcalAccountsTable } from "@colorcal/db/tables";
import {
  EventListParams,
  MoveEventArgs,
  PostParams,
  StopChannelArgs,
  WatchCalendarListParams,
  WatchCalendarListResponse,
  WatchEventsArgs,
  WatchEventsResponse,
} from "./params";
import { calendarListSchema, eventListSchema } from "./schema";

export * from "./params";
export * from "./schema";

interface GCalOptions {
  db: Database;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
}

export class GoogleCalendarAPI {
  private BASE_URL = "https://www.googleapis.com/calendar/v3";

  private REFRESH_THRESHOLD = 5 * 60 * 1000;

  private db: Database;

  private clientId: string;
  private clientSecret: string;

  private accessToken: string;
  private refreshToken: string;
  private accessTokenExpiresAt: Date;

  constructor(opts: GCalOptions) {
    this.db = opts.db;

    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;

    this.accessToken = opts.accessToken;
    this.refreshToken = opts.refreshToken;
    this.accessTokenExpiresAt = opts.accessTokenExpiresAt;
  }

  public async listCalendarList() {
    const PATH = "/users/me/calendarList";
    const params = {
      maxResults: undefined,
      minAccessRole: undefined,
      pageToken: undefined,
      showDeleted: undefined,
      showHidden: undefined,
      syncToken: undefined,
    };

    const response = await this.get(PATH, params);
    const json = await response.json();
    return calendarListSchema.parse(json);
  }

  public async watchCalendarList(args: WatchCalendarListParams) {
    const { id, address } = args;
    const path = "/users/me/calendarList/watch";
    const body = {
      id,
      address,
      type: "web_hook",
      token: undefined,
      params: undefined,
    };

    const response = await this.post({ path, body });
    return (await response.json()) as WatchCalendarListResponse;
  }

  public async listEvents(_params: EventListParams) {
    const { calendarId, ...params } = _params;
    const path = `/calendars/${calendarId}/events`;
    const response = await this.get(path, params);
    const json = await response.json();
    const parsed = eventListSchema.safeParse(json);
    if (!parsed.success) {
      console.error(parsed.error);
      throw new Error("Failed to parse eventsList response");
    }
    return parsed.data;
  }

  public async moveEvent({ eventId, calendarId, ...params }: MoveEventArgs) {
    const path = `/calendars/${calendarId}/events/${eventId}/move`;
    const response = await this.post({ path, body: params });
    await response.body?.cancel("Not needed");
    return;
  }

  public async watchEvents(args: WatchEventsArgs) {
    const { id, address, calendarId, eventTypes } = args;
    const path = `/calendars/${calendarId}/events/watch`;
    const params = { eventTypes };
    const body = {
      id,
      address,
      type: "web_hook",
      token: undefined,
      params: undefined,
    };

    const response = await this.post({ path, params, body });
    return (await response.json()) as WatchEventsResponse;
  }

  public async stopChannel({ id, resourceId }: StopChannelArgs) {
    const path = "/channels/stop";
    const body = { id, resourceId };
    const response = await this.post({ path, body });
    await response.body?.cancel("Not needed");
    return;
  }

  private async get(path: string, _params: Record<string, string | number | boolean | undefined>) {
    await this.fixTokens();

    const params = Object.entries(_params).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>,
    );

    const url = `${this.BASE_URL}${path}?${new URLSearchParams(params)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch ${url}: ${response.statusText} - ${text}`);
    }

    return response;
  }

  private async post({ path, params: _params = {}, body }: PostParams) {
    await this.fixTokens();

    const params = Object.entries(_params).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>,
    );

    const url = `${this.BASE_URL}${path}?${new URLSearchParams(params)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch ${url}: ${response.statusText} - ${text}`);
    }

    return response;
  }

  private async fixTokens() {
    const exp = this.accessTokenExpiresAt.getTime() - this.REFRESH_THRESHOLD;

    if (Date.now() > exp) {
      const refreshToken = this.refreshToken;
      const clientId = this.clientId;
      const clientSecret = this.clientSecret;
      const tokens = await refreshAccessToken({ clientId, clientSecret, refreshToken });

      await this.db
        .update(gcalAccountsTable)
        .set({ accessTokenExpiresAt: tokens.accessTokenExpiresAt, accessToken: tokens.accessToken })
        .where(eq(gcalAccountsTable.accessToken, this.accessToken));

      this.accessToken = tokens.accessToken;
      this.accessTokenExpiresAt = tokens.accessTokenExpiresAt;
    }
  }
}
