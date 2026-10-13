// Postings from the WordPress-era board (/jobs/<title>/<id>). They no longer
// exist, so they answer 410 Gone: Google drops a 410 faster than a 404, and a
// redirect to the job list would be reported as a soft 404.
const BODY = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>This job is no longer available | Oceanblue Solutions, Inc.</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;color:#14212e"><h1>This job is no longer available</h1><p>The posting has closed. See <a href="/careers/search">our open positions</a>.</p></body></html>`;

export function GET() {
  return new Response(BODY, {
    status: 410,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}

export const HEAD = GET;
