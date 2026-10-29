// Vercel serverless function: adds the TMDB key on the server so it never reaches the browser.
// Set TMDB_KEY in Vercel > Project > Settings > Environment Variables.
module.exports = async (req, res) => {
  const key = process.env.TMDB_KEY;
  if (!key) return res.status(500).json({ error: "TMDB_KEY is not set" });
  const path = String(req.query.path || "");
  if (!/^\/(search\/movie|movie\/popular|movie\/\d+)$/.test(path))
    return res.status(400).json({ error: "Path not allowed" });
  const q = new URLSearchParams(req.query);
  q.delete("path");
  const bearer = key.startsWith("eyJ");
  if (!bearer) q.set("api_key", key);
  try {
    const r = await fetch("https://api.themoviedb.org/3" + path + "?" + q, {
      headers: bearer ? { Authorization: "Bearer " + key } : {},
    });
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(r.status).json(await r.json());
  } catch (e) {
    res.status(502).json({ error: "TMDB request failed" });
  }
};
