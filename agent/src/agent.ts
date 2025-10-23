import chokidar from 'chokidar'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import axios from 'axios'

const API = process.env.API_BASE || 'http://localhost:4000'
const SYNC_DIR = process.env.SYNC_DIR || './sync_folder'
const DEVICE_ID = process.env.DEVICE_ID || 'agent-1'
const TOKEN = process.env.AGENT_TOKEN || ''

async function computeFileChunkHashes(filePath: string, chunkSize = 4 * 1024 * 1024) {
  return new Promise<string[]>((resolve, reject) => {
    const hashes: string[] = []
    const stream = fs.createReadStream(filePath, { highWaterMark: chunkSize })
    stream.on('data', (chunk: Buffer) => {
      const h = crypto.createHash('sha256').update(chunk).digest('hex')
      hashes.push(h)
    })
    stream.on('end', () => resolve(hashes))
    stream.on('error', (err) => reject(err))
  })
}

async function uploadChunk(hash: string, buf: Buffer) {
  const url = `${API}/sync/chunk/${hash}`
  await axios.put(url, buf, {
    headers: {
      'Content-Type': 'application/octet-stream',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
    },
    maxBodyLength: Infinity
  })
}

async function uploadMissing(filePath: string) {
  try {
    const rel = path.relative(SYNC_DIR, filePath)
    const hashes = await computeFileChunkHashes(filePath)
    const manifest = { deviceId: DEVICE_ID, files: [{ path: rel, chunkHashes: hashes }] }
    const m = await axios.post(`${API}/sync/manifest`, manifest, {
      headers: { ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) }
    })
    const missing: string[] = m.data.missingChunks || []
    if (missing.length > 0) {
      console.log(`Uploading ${missing.length} missing chunks for ${rel}`)
      const stream = fs.createReadStream(filePath, { highWaterMark: 4 * 1024 * 1024 })
      for await (const chunk of stream) {
        const h = crypto.createHash('sha256').update(chunk as Buffer).digest('hex')
        if (!missing.includes(h)) continue
        await uploadChunk(h, chunk as Buffer)
        console.log('Uploaded chunk', h)
      }
    } else {
      console.log('No missing chunks for', rel)
    }

    await axios.post(`${API}/sync/commit`, {
      filePath: rel,
      deviceId: DEVICE_ID,
      chunkHashes: hashes,
      size: fs.statSync(filePath).size
    }, {
      headers: { ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) }
    })
    console.log('Committed', rel)
  } catch (err: any) {
    console.error('uploadMissing error', err?.response?.data || err.message)
  }
}

if (!fs.existsSync(SYNC_DIR)) fs.mkdirSync(SYNC_DIR, { recursive: true })

const watcher = chokidar.watch(SYNC_DIR, { ignoreInitial: false, persistent: true })
watcher.on('add', p => { console.log('added', p); uploadMissing(p).catch(console.error) })
watcher.on('change', p => { console.log('changed', p); uploadMissing(p).catch(console.error) })

console.log('Agent watching', SYNC_DIR)
