const { GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3, Bucket } = require("./s3");
const KEY = "_meta/index.json";
async function load() {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket, Key: KEY }));
    return JSON.parse(await r.Body.transformToString());
  } catch (e) {
    if (e.name === "NoSuchKey" || (e.$metadata && e.$metadata.httpStatusCode === 404)) return { folders: {}, files: {} };
    throw e;
  }
}
async function save(m) {
  await s3.send(new PutObjectCommand({ Bucket, Key: KEY, Body: JSON.stringify(m), ContentType: "application/json" }));
}
function isPublic(m, kind, id) {
  const n = (kind === "file" ? m.files : m.folders)[id];
  if (!n) return false;
  if (n.public) return true;
  let p = kind === "file" ? n.folder : n.parent, guard = 0;
  while (p && guard++ < 200) {
    const f = m.folders[p];
    if (!f) return false;
    if (f.public) return true;
    p = f.parent;
  }
  return false;
}
function subtree(m, id) {
  const out = [id];
  for (const f of Object.values(m.folders)) if (f.parent === id) out.push(...subtree(m, f.id));
  return out;
}
module.exports = { load, save, isPublic, subtree };
