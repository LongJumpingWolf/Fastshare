const { CompleteMultipartUploadCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { s3, Bucket, admin } = require("../../lib/s3");
const meta = require("../../lib/meta");
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!admin(req, res)) return;
  try {
    const { key, uploadId, parts, name, folder } = req.body || {};
    if (!key || !key.startsWith("files/") || !uploadId || !Array.isArray(parts) || !parts.length)
      return res.status(400).json({ error: "Missing upload details" });
    await s3.send(new CompleteMultipartUploadCommand({
      Bucket, Key: key, UploadId: uploadId, MultipartUpload: { Parts: parts },
    }));
    const head = await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
    const m = await meta.load();
    const id = key.split("/")[1];
    m.files[id] = {
      id, key, name: String(name || key.split("/").pop()).slice(0, 200), size: head.ContentLength,
      folder: folder && m.folders[folder] ? folder : null, public: false, created: Date.now(),
    };
    await meta.save(m);
    res.status(200).json({ meta: m });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
