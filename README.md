# FastShare: deploy on Vercel

Multi-file and folder uploads, folders, per-item public sharing, parallel chunked transfers.

## Storage
- File bytes live in a private Cloudflare R2 bucket at `files/<id>/<name>`.
- Folder metadata and public/private flags live in `_meta/index.json` in that bucket.
- Vercel stores no file data; it runs the API that issues signed links.

## Cloudflare R2 setup
1. Create an R2 bucket.
2. Create an R2 API token with Object Read & Write. Copy its access key, secret, and S3 endpoint (`https://<account-id>.r2.cloudflarestorage.com`).
3. Configure bucket CORS:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Range"],
    "MaxAgeSeconds": 3600
  }
]
```
After deployment, replace `*` with your Vercel site URL.
4. Set a lifecycle rule to abort incomplete multipart uploads after one day.

## Vercel environment variables
Set these before using the app:
- `S3_ENDPOINT`: R2 S3 endpoint
- `S3_KEY`: R2 Access Key ID
- `S3_SECRET`: R2 Secret Access Key
- `S3_BUCKET`: bucket name
- `S3_REGION`: `auto` for Cloudflare R2
- `ADMIN_PASSWORD`: strong owner password

Then redeploy. Keep the R2 bucket private and do not enable public bucket access.

## Usage
Open the site and enter the owner password. Upload files, upload folders, or drag files/folders into the library. Select items to make them public/private, move, rename, or delete. Public items receive shareable links.

## Notes
- 32 MB upload parts, 8 parallel parts per file, up to 3 files at once.
- Chrome/Edge can stream downloads directly to disk. Safari/Firefox buffer downloads in memory, so very large files may fail.
- Single-owner design: avoid simultaneous editing from multiple tabs because metadata is stored as one JSON object.
- Selected files download one at a time. Folder ZIP downloads are not implemented.
