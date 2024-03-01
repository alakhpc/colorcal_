export interface CreateAbsoluteUrlArgs {
  request: Request;
  path: string;
}

export function createAbsoluteUrl(args: CreateAbsoluteUrlArgs) {
  const { request, path } = args;
  const currentUrl = new URL(request.url);
  return new URL(path, currentUrl.origin).toString();
}
