import { createServer, type Server } from 'node:http';
import { buildRouter, type AppOptions } from './routes.ts';

export function createApiServer(options: AppOptions): Server {
  const router = buildRouter(options);
  return createServer((req, res) => {
    void router.handle(req, res);
  });
}
