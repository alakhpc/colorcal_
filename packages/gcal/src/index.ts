import { refreshAccessToken } from "@colorcal/auth/google";
import { Database } from "@colorcal/db";
import { eq } from "@colorcal/db/drizzle";
import { gcalAccountsTable } from "@colorcal/db/tables";
import { CalendarListParams, EventListParams, PostParams } from "./params";
import { GcalEvent, calendarListSchema, eventListSchema } from "./schema";

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

  public async calendarList(params: CalendarListParams = {}) {
    const PATH = "/users/me/calendarList";
    const response = await this.get(PATH, params);
    const json = await response.json();
    return calendarListSchema.parse(json);
  }

  public async eventsList(_params: EventListParams) {
    const { calendarId, ...params } = _params;
    const path = `/calendars/${calendarId}/events`;
    const response = await this.get(path, params);
    const json = await response.json();
    return eventListSchema.parse(json);
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
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  private async post({ path, params: _params, body }: PostParams) {
    await this.fixTokens();

    const params = Object.entries(_params ?? {}).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
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
