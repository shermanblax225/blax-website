const types = {html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', jpg: 'image/jpeg', jpeg: 'image/jpeg'};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/reviews') {
      try {
        return await reviews(request, env.DB);
      } catch {
        return Response.json({error: 'Reviews are temporarily unavailable.'}, {status: 503});
      }
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, {status: 405});
    const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (!Object.hasOwn(assets, name)) return new Response('Not found', {status: 404});
    const headers = {'Content-Type': types[name.split('.').at(-1)], 'Cache-Control': 'public, max-age=300'};
    return new Response(request.method === 'HEAD' ? null : Uint8Array.from(atob(assets[name]), char => char.charCodeAt(0)), {headers});
  }
};

async function reviews(request, db) {
  if (request.method === 'GET') {
    const {results} = await db.prepare('SELECT display_name AS name, rating, comment FROM reviews ORDER BY id DESC LIMIT 40').all();
    return Response.json(results, {headers: {'Cache-Control': 'no-store'}});
  }
  if (request.method !== 'POST') return new Response(null, {status: 405});
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return Response.json({error: 'Invalid review format.'}, {status: 415});
  }
  let body;
  try {
    const raw = await new Response(request.body.pipeThrough(new TransformStream({
      transform(chunk, controller) {
        this.size = (this.size || 0) + chunk.length;
        if (this.size > 8192) throw new Error('Request too large');
        controller.enqueue(chunk);
      }
    }))).text();
    body = JSON.parse(raw);
  } catch {
    return Response.json({error: 'Invalid review format.'}, {status: 400});
  }
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';
  const rating = body?.rating;
  if (name.length > 80 || !comment || comment.length > 1000 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({error: 'Choose a rating and enter a review of up to 1,000 characters.'}, {status: 400});
  }
  await db.prepare('INSERT OR IGNORE INTO reviews (display_name, rating, comment) VALUES (?, ?, ?)').bind(name, rating, comment).run();
  return Response.json({published: true}, {status: 201});
}
