const crypto = require("crypto");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3, Bucket, admin, signGet } = require("../lib/s3");
const meta = require("../lib/meta");
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!admin(req, res)) return;
  try {
    const b = req.body || {};
    const m = await meta.load();
    const bag = k => (k === "file" ? m.files : m.folders);
    const items = (b.items || []).filter(i => i && bag(i.kind) && bag(i.kind)[i.id]);
    let extra = {};
    if (b.action === "link") {
      const f = m.files[b.id];
      if (!f) return res.status(404).json({ error: "File not found" });
      return res.status(200).json({ url: await signGet(f.key, f.name), size: f.size, name: f.name });
    }
    if (b.action === "createFolder") {
      const name = String(b.name || "").trim().slice(0, 100);
      if (!name) return res.status(400).json({ error: "Folder needs a name" });
      const parent = b.parent && m.folders[b.parent] ? b.parent : null;
      const id = crypto.randomBytes(6).toString("hex");
      m.folders[id] = { id, name, parent, public: false };
      extra.folder = m.folders[id];
    } else if (b.action === "rename") {
      const n = items[0]; const name = String(b.name || "").trim().slice(0, 200);
      if (!n || !name) return res.status(400).json({ error: "Nothing to rename" });
      bag(n.kind)[n.id].name = name;
    } else if (b.action === "setPublic") {
      items.forEach(i => { bag(i.kind)[i.id].public = !!b.value; });
    } else if (b.action === "move") {
      const to = b.to && m.folders[b.to] ? b.to : null;
      for (const i of items) {
        if (i.kind === "file") m.files[i.id].folder = to;
        else {
          if (to && meta.subtree(m, i.id).includes(to)) return res.status(400).json({ error: "Can't move a folder into itself" });
          m.folders[i.id].parent = to;
        }
      }
    } else if (b.action === "delete") {
      const fileIds = new Set(), folderIds = new Set();
      for (const i of items) {
        if (i.kind === "file") fileIds.add(i.id);
        else meta.subtree(m, i.id).forEach(f => folderIds.add(f));
      }
      for (const f of Object.values(m.files)) if (folderIds.has(f.folder)) fileIds.add(f.id);
      await Promise.all([...fileIds].map(id => s3.send(new DeleteObjectCommand({ Bucket, Key: m.files[id].key }))));
      fileIds.forEach(id => delete m.files[id]);
      folderIds.forEach(id => delete m.folders[id]);
    } else return res.status(400).json({ error: "Unknown action" });
    await meta.save(m);
    res.status(200).json({ meta: m, ...extra });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
