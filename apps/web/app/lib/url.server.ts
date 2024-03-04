import { AppLoadContext } from "@remix-run/cloudflare";

export interface CreateAbsoluteUrlArgs {
  request: Request;
  path: string;
}

export function createAbsoluteUrl(args: CreateAbsoluteUrlArgs) {
  const { request, path } = args;
  const currentUrl = new URL(request.url);
  return new URL(path, currentUrl.origin).toString();
}

export interface CreateWebhookUrlArgs {
  request: Request;
  context: AppLoadContext;
  path: string;
}

export function createWebhookUrl(args: CreateWebhookUrlArgs) {
  const { request, context, path } = args;
  if (context.cloudflare.env.WEBHOOK_BASE) {
    return `${context.cloudflare.env.WEBHOOK_BASE}${path}`;
  }

  return createAbsoluteUrl({ request, path });
}
