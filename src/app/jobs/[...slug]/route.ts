// Postings from the WordPress-era board (/jobs/<title>/<id>). They no longer
// exist, so they answer 410 Gone: Google drops a 410 faster than a 404, and a
// redirect to the job list would be reported as a soft 404. Self-contained
// HTML in the site's palette, centred on the screen.

// A briefcase whose time has run out: brand fills, the clock as the "closed" badge
const ICON = `<svg aria-hidden="true" viewBox="0 0 64 64" width="96" height="96">
  <rect x="6" y="18" width="44" height="34" rx="5" fill="#0a72c0"/>
  <rect x="6" y="18" width="44" height="12" rx="5" fill="#085c9c"/>
  <path d="M21 18v-5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5" fill="none" stroke="#0b2e46" stroke-width="3.5" stroke-linecap="round"/>
  <rect x="24" y="27" width="8" height="6" rx="1.5" fill="#c9e4ef"/>
  <circle cx="47" cy="45" r="13" fill="#ffffff"/>
  <circle cx="47" cy="45" r="11" fill="#0caacf"/>
  <path d="M47 39v6.5l4 2.5" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const BODY = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>This job is no longer available | Oceanblue Solutions, Inc.</title><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap"><style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:1.5rem;background:#f5f8fa;color:#0b2e46;font-family:"General Sans",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
main{width:100%;max-width:34rem;text-align:center;background:#fff;padding:3rem 2rem;box-shadow:0 1px 0 #dbe5ea}
h1{margin:1.5rem 0 0;font-size:clamp(1.75rem,4vw,2.25rem);font-weight:600;letter-spacing:-0.02em;line-height:1.15}
p{margin:.75rem auto 0;max-width:30ch;color:#4b6273;font-size:1.0625rem;line-height:1.5}
.actions{margin-top:2rem;display:flex;flex-wrap:wrap;gap:.75rem;justify-content:center}
a{display:inline-flex;align-items:center;min-height:3rem;padding:0 1.5rem;font-weight:500;text-decoration:none}
.primary{background:#0a72c0;color:#fff}.primary:hover{background:#085c9c}
.secondary{color:#0b2e46;box-shadow:inset 0 0 0 2px #0b2e46}.secondary:hover{background:#0b2e46;color:#fff}
a:focus-visible{outline:2px solid #0a72c0;outline-offset:3px}
</style></head><body><main>${ICON}<h1>This job is no longer available</h1><p>The posting has closed. See the roles open right now.</p><div class="actions"><a class="primary" href="/jobs">See open positions</a><a class="secondary" href="/">Go to homepage</a></div></main></body></html>`;

export function GET() {
  return new Response(BODY, {
    status: 410,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}

export const HEAD = GET;
