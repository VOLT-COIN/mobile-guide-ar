// Cloudflare Pages Function: fetches public RSS feeds directly, filters crypto-relevant items, caches 5 minutes at the edge.
const FEEDS = [
  ["Cointelegraph", "https://cointelegraph.com/rss"],
  ["CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss/"],
  ["Decrypt", "https://decrypt.co/feed"],
  ["Bitcoin Magazine", "https://bitcoinmagazine.com/.rss/full/"]
];
const RELEVANT = /bitcoin|\bbtc\b|ethereum|\beth\b|crypto|blockchain|token|\bcoins?\b|defi|\bnft|stablecoin|solana|ripple|\bxrp\b|dogecoin|binance|coinbase|\betfs?\b|altcoin|web3|wallet|\bmin(?:ing|ers?)\b|satoshi|ledger|memecoin|on-?chain|\bdao\b|airdrop|staking|tether|\busdt\b|\busdc\b|\bsec\b|cftc|exchange|digital asset|halving/i;
function clean(s) {
  return (s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&apos;/g, "'").trim();
}
function tag(block, name) {
  const m = block.match(new RegExp("<" + name + "[^>]*>([\\s\\S]*?)</" + name + ">", "i"));
  return m ? clean(m[1]) : "";
}
function parse(xml, src) {
  const out = [];
  const parts = xml.split(/<item[ >]/i).slice(1);
  for (const p of parts) {
    const title = tag(p, "title"), link = tag(p, "link"), pub = tag(p, "pubDate");
    const cats = [...p.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map(m => clean(m[1]));
    const t = Date.parse(pub);
    if (!title || !/^https?:\/\//.test(link) || isNaN(t)) continue;
    out.push({ src, t: title, l: link, d: t, c: cats, rel: RELEVANT.test(title + " " + cats.join(" ")) });
  }
  return out;
}
export async function onRequestGet(ctx) {
  const cache = caches.default;
  const key = new Request(new URL("/api/news", ctx.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  const sources = [];
  let items = [];
  await Promise.all(FEEDS.map(async ([name, url]) => {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; NabdCryptoNews/1.0; headlines-only)" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const all = parse(await r.text(), name);
      const rel = all.filter(i => i.rel);
      sources.push({ name, ok: true, total: all.length, shown: rel.length, newest: all.length ? Math.max(...all.map(i => i.d)) : null });
      items = items.concat(rel);
    } catch (e) {
      sources.push({ name, ok: false, error: String(e.message || e).slice(0, 60) });
    }
  }));
  items.sort((a, b) => b.d - a.d);
  const body = JSON.stringify({ fetchedAt: Date.now(), sources, items: items.slice(0, 40).map(({ src, t, l, d }) => ({ src, t, l, d })) });
  const ok = sources.some(s => s.ok);
  const res = new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": ok ? "public, max-age=60, s-maxage=300" : "no-store", "Access-Control-Allow-Origin": "*" } });
  if (ok) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
