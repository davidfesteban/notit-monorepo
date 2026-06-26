import DOMPurify from 'dompurify'
import { marked } from 'marked'

const renderer = {
  code(token) {
    if (token.lang === 'mermaid') {
      return `<div class="mermaid" data-source="${escapeHtml(token.text)}">${escapeHtml(token.text)}</div>`
    }

    const lang = token.lang ? ` class="language-${escapeHtml(token.lang)}"` : ''
    return `<pre><code${lang}>${escapeHtml(token.text)}</code></pre>`
  },
}

marked.use({
  gfm: true,
  breaks: true,
  renderer,
})

export function renderMarkdown(markdown) {
  return DOMPurify.sanitize(marked.parse(markdown || ''), {
    ADD_TAGS: ['input'],
    ADD_ATTR: ['checked', 'class', 'data-source', 'type'],
  })
}

export function toggleTask(markdown, taskIndex, checked) {
  let currentIndex = -1

  return markdown
    .split('\n')
    .map((line) => {
      if (!/^\s*[-*]\s+\[[ xX]\]\s+/.test(line)) return line

      currentIndex += 1
      if (currentIndex !== taskIndex) return line

      return line.replace(/\[[ xX]\]/, checked ? '[x]' : '[ ]')
    })
    .join('\n')
}

export function frontmatterFor(note) {
  return [
    '---',
    `title: ${quoteYaml(note.title)}`,
    `description: ${quoteYaml(note.description || '')}`,
    `createdDate: ${quoteYaml(note.createdDate)}`,
    '---',
    '',
  ].join('\n')
}

export function parseNoteFile(path, markdown, commit = {}) {
  const { attributes, body } = splitFrontmatter(markdown)
  const title = readScalar(attributes.title) || titleFromPath(path)
  const description = readScalar(attributes.description) || firstContentLine(body)

  return {
    id: path,
    path,
    title,
    description,
    body,
    markdown,
    createdDate: readScalar(attributes.createdDate) || dateFromPath(path),
    updatedDate: commit.date || readScalar(attributes.createdDate) || dateFromPath(path),
    commitSha: commit.sha || '',
    fileSha: commit.fileSha || '',
    dirty: false,
  }
}

export function buildMarkdown(note) {
  return `${frontmatterFor(note)}${note.body || ''}`.trimEnd() + '\n'
}

export function notePathFor(title, date = new Date()) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `notes/${dd}-${mm}-${yyyy}-${slugify(title || 'untitled')}.md`
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled'
}

function splitFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) {
    return { attributes: {}, body: markdown }
  }

  const end = markdown.indexOf('\n---', 4)
  if (end === -1) {
    return { attributes: {}, body: markdown }
  }

  const raw = markdown.slice(4, end).trim()
  const body = markdown.slice(end + 5).replace(/^\n/, '')
  const attributes = {}

  for (const line of raw.split('\n')) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    attributes[key] = value
  }

  return { attributes, body }
}

function quoteYaml(value) {
  return `"${String(value || '').replaceAll('"', '\\"')}"`
}

function readScalar(value) {
  return String(value || '').replace(/^"|"$/g, '').replaceAll('\\"', '"')
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function titleFromPath(path) {
  return path
    .replace(/^notes\//, '')
    .replace(/\.md$/, '')
    .replace(/^\d{2}-\d{2}-\d{4}-/, '')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function dateFromPath(path) {
  const match = path.match(/notes\/(\d{2})-(\d{2})-(\d{4})-/)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : new Date().toISOString().slice(0, 10)
}

function firstContentLine(body) {
  return body
    .split('\n')
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .find(Boolean) || ''
}
