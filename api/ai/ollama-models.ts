export const config = { runtime: 'edge' };

export default async function handler() {
  return new Response(JSON.stringify({ installed: false, models: [] }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
