import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpError, sendJson } from './http.ts';

export interface Context {
  req: IncomingMessage;
  res: ServerResponse;
  params: Record<string, string>;
  query: URLSearchParams;
}

/** Return a value to send it as JSON with status 200, or send the response yourself and return undefined. */
export type Handler = (context: Context) => unknown;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

/** Just enough routing for a handful of JSON endpoints: exact segments and `:param` captures. */
export class Router {
  private readonly routes: Route[] = [];

  on(method: string, path: string, handler: Handler): this {
    const keys: string[] = [];
    const source = path
      .split('/')
      .map((segment) => {
        if (!segment.startsWith(':')) return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        keys.push(segment.slice(1));
        return '([^/]+)';
      })
      .join('/');
    this.routes.push({ method, pattern: new RegExp(`^${source}$`), keys, handler });
    return this;
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');
    try {
      let pathMatched = false;
      for (const route of this.routes) {
        const match = route.pattern.exec(url.pathname);
        if (!match) continue;
        pathMatched = true;
        if (route.method !== req.method) continue;
        const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(match[i + 1] ?? '')]));
        const result = await route.handler({ req, res, params, query: url.searchParams });
        if (result !== undefined && !res.headersSent) sendJson(res, 200, result);
        return;
      }
      throw pathMatched ? new HttpError(405, 'Method not allowed') : new HttpError(404, `No route for ${url.pathname}`);
    } catch (error) {
      if (res.headersSent) return;
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: error.message });
      } else {
        console.error(error);
        sendJson(res, 500, { error: 'Internal error' });
      }
    }
  }
}
