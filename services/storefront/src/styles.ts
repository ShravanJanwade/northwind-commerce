export const SITE_CSS = `:root {
  color-scheme: light dark;
  --bg: #faf8f5;
  --surface: #ffffff;
  --ink: #1f1b16;
  --muted: #6b6259;
  --accent: #8a4b2a;
  --border: #e6dfd6;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #171412; --surface: #211d1a; --ink: #f2ede7; --muted: #b3a89c; --accent: #e09a6c; --border: #3a332d; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); line-height: 1.5; }
a { color: var(--accent); }
header, main, footer { max-width: 1080px; margin: 0 auto; padding: 16px; }
header { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap; }
header .brand { font-weight: 700; font-size: 20px; text-decoration: none; color: var(--ink); }
header .region { color: var(--muted); font-size: 14px; }
h1 { font-size: 28px; margin: 8px 0 4px; }
h2 { font-size: 20px; margin: 32px 0 12px; text-transform: capitalize; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 6px; }
.card a { text-decoration: none; color: var(--ink); font-weight: 600; }
.price { font-weight: 700; font-size: 18px; }
.muted { color: var(--muted); font-size: 14px; }
.sold-out { color: var(--muted); font-weight: 600; }
footer { color: var(--muted); font-size: 13px; border-top: 1px solid var(--border); margin-top: 40px; }
`;
