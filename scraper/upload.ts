import { readFile } from 'node:fs/promises';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SnapshotSchema } from '../shared/types.js';

const BUCKET = 'ig-bpollard-take-home-be-bucket';

async function main() {
  const body = await readFile('data.json', 'utf8');
  const snapshot = SnapshotSchema.parse(JSON.parse(body));

  const s3 = new S3Client({ region: 'us-east-1' });
  const keys = ['data.json', `snapshots/${snapshot.fetchedAt}.json`];

  for (const key of keys) {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: 'application/json',
      }),
    );
    console.log(`Uploaded s3://${BUCKET}/${key}`);
  }
}

main().catch((e) => {
  console.error(`Upload failed: ${e instanceof Error ? e.message : e}`);
  console.error('Hint: requires AWS credentials (AWS_PROFILE=personal-challenge).');
  process.exit(1);
});
