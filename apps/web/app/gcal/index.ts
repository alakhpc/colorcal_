import { Database, eq } from "@colorcal/db";
import { gcalAccounts } from "@colorcal/db/schema";
import { AppLoadContext } from "@remix-run/cloudflare";
import { refreshAccessToken } from "../lib/auth.server";
import { CalendarListParams, PostParams } from "./params";
import { calendarListSchema } from "./schemas";

interface GCalOptions {
  request: Request;
  context: AppLoadContext;

  db: Database;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
}

export class Gcal {
  private BASE_URL = "https://www.googleapis.com/calendar/v3";

  private REFRESH_THRESHOLD = 5 * 60 * 1000;

  private request: Request;
  private context: AppLoadContext;

  private db: Database;

  private accessToken: string;
  private refreshToken: string;
  private accessTokenExpiresAt: Date;

  constructor(opts: GCalOptions) {
    this.request = opts.request;
    this.context = opts.context;

    this.db = opts.db;
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

  private async get(path: string, _params: Record<string, string | number | boolean>) {
    await this.fixTokens();

    const params = Object.entries(_params).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
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
      const request = this.request;
      const context = this.context;
      const refreshToken = this.refreshToken;

      const tokens = await refreshAccessToken({ request, context, refreshToken });

      await this.db
        .update(gcalAccounts)
        .set({ accessTokenExpiresAt: tokens.accessTokenExpiresAt, accessToken: tokens.accessToken })
        .where(eq(gcalAccounts.accessToken, this.accessToken));

      this.accessToken = tokens.accessToken;
      this.accessTokenExpiresAt = tokens.accessTokenExpiresAt;
    }
  }
}
