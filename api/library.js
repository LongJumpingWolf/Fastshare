const { admin } = require("../lib/s3");
const meta = require("../lib/meta");
module.exports = async (req, res) => {
  if (!admin(req, res)) return;
  try { res.status(200).json({ meta: await meta.load() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
};
