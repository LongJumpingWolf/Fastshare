// Backup route for downloads, used only if the browser can't read Catbox directly (CORS).
// Streams one small byte range at a time. Only Catbox hosts are allowed.
const ALLOWED = new Set(["files.catbox.moe", "litter.catbox.moe"]);
const MAX = 4 * 1024 * 1024; // stays under Vercel's 4.5 MB response limit

module.exports = async (req, res) => {
  try {
    const u = new URL(String(req.query.u || ""));
    if (u.protocol !== "https:" || !ALLOWED.has(u.hostname)) return res.status(400).json({ error: "Host not allowed" });
    const range = req.headers.range || "";
    if (!/^bytes=\d+-\d+$/.test(range)) return res.status(400).json({ error: "A byte range is required" });
    const [a, b] = range.slice(6).split("-").map(Number);
    if (b < a || b - a + 1 > MAX) return res.status(400).json({ error: "Range too large" });
    const r = await fetch(u, { headers: { Range: range } });
    if (r.status !== 206) return res.status(502).json({ error: "Host did not honour the range (" + r.status + ")" });
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Range", r.headers.get("content-range") || "");
    res.setHeader("Cache-Control", "no-store");
    res.status(206).send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
