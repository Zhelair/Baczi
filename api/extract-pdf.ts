/**
 * POST /api/extract-pdf
 * Body: { base64: string, name: string }
 * Returns: { text: string }
 * No auth required — text extraction only, no AI cost
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import pdfParse from 'pdf-parse'

const MAX_CHARS = 8000

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { base64 } = req.body as { base64?: string; name?: string }
  if (!base64) return res.status(400).json({ error: 'Missing base64 data' })

  try {
    const buffer = Buffer.from(base64, 'base64')
    const data = await pdfParse(buffer)
    const text = data.text.trim().slice(0, MAX_CHARS)
    return res.status(200).json({ text, pages: data.numpages })
  } catch {
    return res.status(400).json({ error: 'Failed to parse PDF' })
  }
}
