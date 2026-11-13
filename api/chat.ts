import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from '../server/devProxyPlugin.ts';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const handled = await handleApiRequest(req, res);
  if (handled === false && !res.writableEnded) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Endpoint /api/chat introuvable ou méthode non autorisée.' }));
  }
}
