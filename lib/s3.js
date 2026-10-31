const crypto = require("crypto");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: process.env.S3_PATH_STYLE === "1",
  credentials: { accessKeyId: process.env.S3_KEY || "", secretAccessKey: process.env.S3_SECRET || "" },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
const Bucket = process.env.S3_BUCKET;
const PART = 32 * 1024 * 1024;
const h = s => crypto.createHash("sha256").update(String(s)).digest();
function admin(req, res) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) { res.status(500).json({ error: "ADMIN_PASSWORD is not set on the server" }); return false; }
  if (!crypto.timingSafeEqual(h(req.headers["x-password"] || ""), h(pw))) {
    res.status(401).json({ error: "Wrong password" }); return false;
  }
  return true;
}
function signGet(Key, name) {
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket, Key,
    ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
  }), { expiresIn: 21600 });
}
module.exports = { s3, Bucket, PART, admin, signGet };
