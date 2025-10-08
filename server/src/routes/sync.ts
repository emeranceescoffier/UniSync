import express from 'express';
import getPool from '../db';
import { minioClient, ensureBucket } from '../util/s3';

const router = express.Router();

router.post('/manifest', async (req, res) => {
  try {
    const { deviceId, files } = req.body;
    const pool = getPool();
    const all: string[] = Array.from(new Set((files || []).flatMap((f: any) => f.chunkHashes || [])));
    if (all.length === 0) return res.json({ missingChunks: [] });
    const q = await pool.query('SELECT hash FROM chunks WHERE hash = ANY($1)', [all]);
    const existing: Set<string> = new Set(q.rows.map((r: any) => r.hash as string));
    const missing = all.filter(h => !existing.has(h));
    res.json({ missingChunks: missing });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'server error' });
  }
});

export default router;