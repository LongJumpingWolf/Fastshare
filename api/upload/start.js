const crypto = require("crypto");
const { CreateMultipartUploadCommand, UploadPartCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3, Bucket, PART, admin } = require("../../lib/s3");
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!admin(req, res)) return;
  try {
    const { name, size, type } = req.body || {};
    if (!Bucket) return res.status(500).json({ error: "S3_BUCKET is not set" });
    if (!name || !Number.isFinite(size) || size < 0) return res.status(400).json({ error: "Missing file name or size" });
    const n = Math.max(1, Math.ceil(size / PART));
    if (n > 10000) return res.status(400).json({ error: "File too large (max about 320 GB)" });
    const safe = String(name).replace(/[^\w.\- ]/g, "_").slice(0, 120) || "file";
    const Key = "files/" + crypto.randomBytes(8).toString("hex") + "/" + safe;
    const { UploadId } = await s3.send(new CreateMultipartUploadCommand({
      Bucket, Key, ContentType: type || "application/octet-stream",
    }));
    const urls = await Promise.all(Array.from({ length: n }, (_, i) =>
      getSignedUrl(s3, new UploadPartCommand({ Bucket, Key, UploadId, PartNumber: i + 1 }), { expiresIn: 86400 })));
    res.status(200).json({ key: Key, uploadId: UploadId, partSize: PART, urls });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
