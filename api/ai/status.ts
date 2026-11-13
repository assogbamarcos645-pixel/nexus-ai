import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from '../../server/devProxyPlugin.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const handled = await handleApiRequest(req, res);
    if (handled === false && !res.writableEnded) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Endpoint /api/ai/status introuvable.' }));
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Vercel status error]', err);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: `Erreur fonction Vercel : ${errorMsg}` }));
    }
  }
}
