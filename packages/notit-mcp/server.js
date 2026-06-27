#!/usr/bin/env node

import { execFile } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const repoDir = path.resolve(process.env.NOTIT_REPO_DIR || process.cwd())
const notesDir = path.resolve(process.env.NOTIT_NOTES_DIR || path.join(repoDir, 'notes'))

let input = Buffer.alloc(0)

process.stdin.on('data', (chunk) => {
  input = Buffer.concat([input, chunk])
  readMessages()
})

process.stdin.resume()

function readMessages() {
  while (true) {
    const headerEnd = input.indexOf('\r\n\r\n')
    if (headerEnd === -1) return

    const header = input.slice(0, headerEnd).toString('utf8')
    const match = header.match(/content-length:\s*(\d+)/i)
    if (!match) {
      input = input.slice(headerEnd + 4)
      continue
    }

    const length = Number(match[1])
    const bodyStart = headerEnd + 4
    const bodyEnd = bodyStart + length
    if (input.length < bodyEnd) return

    const body = input.slice(bodyStart, bodyEnd).toString('utf8')
    input = input.slice(bodyEnd)

    handleMessage(JSON.parse(body)).catch((error) => {
      if (body.includes('"id"')) sendError(JSON.parse(body).id, -32603, error.message)
    })
  }
}

async function handleMessage(message) {
  if (!message.id) return

  if (message.method === 'initialize') {
    sendResult(message.id, {
      protocolVersion: message.params?.protocolVersion || '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'notit-mcp', version: '0.1.0' },
      instructions:
        'Use Notit tools to read and update Markdown notes in the configured local notes repo. Notes live in notes/*.md. Keep edits focused and preserve Markdown structure.',
    })
    return
  }

  if (message.method === 'tools/list') {
    sendResult(message.id, { tools: toolDefinitions() })
    return
  }

  if (message.method === 'tools/call') {
    const result = await callTool(message.params?.name, message.params?.arguments || {})
    sendResult(message.id, result)
    return
  }

  sendError(message.id, -32601, `Unknown method: ${message.method}`)
}

function toolDefinitions() {
  return [
    {
      name: 'list_notes',
      description: 'List Notit Markdown notes from a local notes repo.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'search_notes',
      description: 'Search local Notit notes by title, path, or Markdown body.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
        additionalProperties: false,
      },
    },
    {
      name: 'read_note',
      description: 'Read a local Notit note Markdown file by path.',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
        additionalProperties: false,
      },
    },
    {
      name: 'write_note',
      description: 'Create or update a local Notit note under notes/*.md.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          markdown: { type: 'string' },
        },
        required: ['path', 'markdown'],
        additionalProperties: false,
      },
    },
    {
      name: 'note_history',
      description: 'List recent local git commits for a Notit note path.',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
        additionalProperties: false,
      },
    },
  ]
}

async function callTool(name, args) {
  if (name === 'list_notes') {
    const notes = await listNotes()
    return text(notes.map((note) => `${note.path} — ${note.title}`).join('\n') || 'No notes found.')
  }

  if (name === 'search_notes') {
    const query = String(args.query || '').toLowerCase()
    const notes = await listNotes()
    const matches = []
    for (const note of notes) {
      const markdown = await getText(note.path)
      if (`${note.path}\n${note.title}\n${markdown}`.toLowerCase().includes(query)) {
        matches.push(`${note.path} — ${note.title}`)
      }
    }
    return text(matches.join('\n') || 'No matches.')
  }

  if (name === 'read_note') {
    return text(await getText(notePath(args.path)))
  }

  if (name === 'write_note') {
    const safePath = notePath(args.path)
    await putText(safePath, String(args.markdown || ''))
    return text(`Wrote ${safePath}`)
  }

  if (name === 'note_history') {
    return text(await noteHistory(notePath(args.path)))
  }

  throw new Error(`Unknown tool: ${name}`)
}

async function listNotes() {
  const paths = await walk(notesDir)
  return paths
    .filter((filePath) => filePath.endsWith('.md'))
    .map((filePath) => path.relative(repoDir, filePath).split(path.sep).join('/'))
    .filter((filePath) => filePath.startsWith('notes/'))
    .sort()
    .map((filePath) => ({ path: filePath, title: titleFromPath(filePath) }))
}

async function walk(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const files = await Promise.all(
      entries.map((entry) => {
        const next = path.join(dir, entry.name)
        return entry.isDirectory() ? walk(next) : next
      }),
    )
    return files.flat()
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

async function getText(filePath) {
  return fs.readFile(resolveNotePath(filePath), 'utf8')
}

async function putText(filePath, markdown) {
  const absolutePath = resolveNotePath(filePath)
  await fs.mkdir(path.dirname(absolutePath), { recursive: true })
  await fs.writeFile(absolutePath, markdown, 'utf8')
}

async function noteHistory(filePath) {
  try {
    const { stdout } = await execFileAsync('git', ['log', '--max-count=20', '--date=iso', '--pretty=format:%h %ad %s', '--', filePath], {
      cwd: repoDir,
    })
    return stdout || 'No history found.'
  } catch {
    return 'No local git history available. Clone the notes repo locally to enable history.'
  }
}

function notePath(value) {
  const filePath = String(value || '').replace(/^\/+/, '')
  if (!filePath.startsWith('notes/') || !filePath.endsWith('.md')) throw new Error('Path must be under notes/*.md')
  return filePath
}

function resolveNotePath(filePath) {
  const absolutePath = path.resolve(repoDir, notePath(filePath))
  if (!absolutePath.startsWith(notesDir + path.sep) && absolutePath !== notesDir) throw new Error('Path escapes notes directory.')
  return absolutePath
}

function titleFromPath(filePath) {
  return filePath.replace(/^notes\//, '').replace(/\.md$/, '').replace(/^\d{2}-\d{2}-\d{4}-/, '').replace(/-/g, ' ')
}

function text(value) {
  return { content: [{ type: 'text', text: value }] }
}

function sendResult(id, result) {
  send({ jsonrpc: '2.0', id, result })
}

function sendError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } })
}

function send(message) {
  const body = JSON.stringify(message)
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`)
}
