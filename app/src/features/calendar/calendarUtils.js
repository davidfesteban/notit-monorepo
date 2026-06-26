export function filterNotes(items, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return items
  return items.filter((note) => `${note.title} ${note.description} ${note.body}`.toLowerCase().includes(normalized))
}

export function groupByDate(items) {
  return items.reduce((dates, note) => {
    const key = displayDate(note.updatedDate)
    dates[key] ||= []
    dates[key].push(note)
    return dates
  }, {})
}

export function displayDate(value) {
  return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function monthYearLabel(value) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(value))
}

export function uniquePath(path, existingNotes) {
  const used = new Set(existingNotes.map((note) => note.path))
  if (!used.has(path)) return path

  const base = path.replace(/\.md$/, '')
  let index = 2
  while (used.has(`${base}-${index}.md`)) index += 1
  return `${base}-${index}.md`
}
