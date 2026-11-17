<!-- 📍 /infrastructure/docker/minio/README.md -->
# MinIO — Local S3 Storage

## Access

- **S3 API Endpoint:** http://localhost:9000
- **Web Console:** http://localhost:9001

## Credentials (from `.env`)

| Field | Default |
|---|---|
| Access Key | `minioadmin` |
| Secret Key | `minioadmin` |
| Bucket | `property-images` |

## Bucket Policy

`minio-init` container automatically creates the bucket and sets it to
**public-read** (so uploaded property images load directly).

Write access stays private — only the API (with credentials) can upload.

## Verify it's working

```bash
# List buckets
docker exec pm-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec pm-minio mc ls local

docker compose down -v   # also removes volumes