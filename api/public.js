// Anonymous access. Only returns things that are marked public (directly or via a parent folder).
const { signGet } = require("../lib/s3");
const meta = require("../lib/meta");
const NOPE = { error: "This link isn't shared, or it no longer exists." };
module.exports = async (req, res) => {
  try {
    const m = await meta.load();
    const { file, folder } = req.query;
    if (file) {
      if (!meta.isPublic(m, "file", file)) return res.status(404).json(NOPE);
      const f = m.files[file];
      return res.status(200).json({ url: await signGet(f.key, f.name), size: f.size, name: f.name });
    }
    if (folder) {
      if (!meta.isPublic(m, "folder", folder)) return res.status(404).json(NOPE);
      const d = m.folders[folder];
      const up = d.parent && meta.isPublic(m, "folder", d.parent) ? d.parent : null;
      return res.status(200).json({
        id: d.id, name: d.name, up,
        folders: Object.values(m.folders).filter(f => f.parent === folder).map(f => ({ id: f.id, name: f.name })),
        files: Object.values(m.files).filter(f => f.folder === folder).map(f => ({ id: f.id, name: f.name, size: f.size })),
      });
    }
    res.status(400).json(NOPE);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
