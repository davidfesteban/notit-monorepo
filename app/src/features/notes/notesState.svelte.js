import { buildMarkdown, notePathFor, parseNoteFile } from '../../shared/markdown/markdown.js'
import { clearAllDrafts, clearDraft, loadDrafts, saveDraft } from '../../shared/storage/localDrafts.js'
import { loadSession, saveCommitMeta } from '../../shared/storage/sessionStorage.js'
import { uniquePath } from '../calendar/calendarUtils.js'

export function createNotesState() {
  const session = loadSession()

  let notes = $state([])
  let selectedPath = $state('')
  let historyMode = $state(false)
  let historyBaseNote = $state(null)
  let historyVersions = $state([])
  let selectedHistoryNote = $state(null)
  let commitMeta = $state(session.commitMeta || {})
  let loading = $state(false)
  let status = $state('')
  let error = $state('')

  const selectedNote = $derived(selectedHistoryNote || notes.find((note) => note.path === selectedPath) || notes[0] || null)
  const hasDirtyDrafts = $derived(notes.some((note) => note.dirty))

  $effect(() => {
    if (!selectedPath && notes.length) selectedPath = notes[0].path
  })

  async function loadFromRepo(client, repo) {
    if (!client || !repo.owner || !repo.name) return

    loading = true
    clearMessage()
    status = 'Loading notes from GitHub...'

    try {
      await client.ensureMasterBranch(repo.owner, repo.name, 'master')
      const [files, drafts] = await Promise.all([client.listNotes(repo.owner, repo.name), loadDrafts()])
      const remoteNotes = files.map((file) =>
        parseNoteFile(file.path, file.markdown, {
          sha: commitMeta[file.path] || file.commitSha,
          date: file.commitDate,
          fileSha: file.fileSha,
        }),
      )
      notes = mergeDrafts(remoteNotes, drafts).sort(sortByUpdatedDate)
      selectedPath = notes[0]?.path || ''
      status = notes.length ? 'Notes loaded.' : 'Repo connected. Create your first note.'
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }

  function createNote() {
    const title = 'Untitled note'
    const createdDate = new Date().toISOString().slice(0, 10)
    const path = uniquePath(notePathFor(title), notes)
    const note = {
      id: path,
      path,
      title,
      description: '',
      body: '# Untitled note\n\nStart writing.',
      createdDate,
      updatedDate: createdDate,
      commitSha: '',
      fileSha: '',
      dirty: true,
    }

    notes = [note, ...notes]
    selectedPath = path
    persistDraft(note)
    status = 'New local note. Save to push it to GitHub.'
  }

  async function saveSelected(client, repo) {
    if (selectedHistoryNote) return
    await saveNote(client, repo, selectedNote, 'manual')
  }

  async function saveDirty(client, repo, reason = 'autosave') {
    if (!client || !repo.owner || !repo.name || loading) return
    for (const note of notes.filter((note) => note.dirty)) await saveNote(client, repo, note, reason)
  }

  async function saveNote(client, repo, note, reason) {
    if (!client || !repo.owner || !repo.name || !note) {
      error = 'Connect GitHub and choose a repo before saving.'
      return
    }

    loading = true
    clearMessage()

    try {
      const oldPath = note.path
      const path = ensurePathMatchesTitle(note, notes)
      const markdown = buildMarkdown({ ...note, path })
      const result = await client.commitFiles(repo.owner, repo.name, {
        message: `${reason === 'autosave' ? 'Autosave' : 'Save'} ${path}`,
        additions: [{ path, contentBase64: encodeBase64(markdown) }],
        deletions: oldPath !== path && note.commitSha ? [oldPath] : [],
      })
      const savedNote = {
        ...note,
        id: path,
        path,
        commitSha: result.commitSha,
        updatedDate: result.commitDate,
        dirty: false,
      }

      commitMeta = { ...commitMeta, [path]: result.commitSha }
      saveCommitMeta(commitMeta)
      await clearDraft(oldPath)
      notes = notes.map((item) => (item.path === oldPath ? savedNote : item)).sort(sortByUpdatedDate)
      selectedPath = path
      status = reason === 'autosave' ? 'Autosaved to GitHub.' : 'Saved to GitHub.'
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }

  async function deleteNote(client, repo, note) {
    if (!note) return
    if (!note.commitSha) {
      await clearDraft(note.path)
      notes = notes.filter((item) => item.path !== note.path)
      selectedPath = notes[0]?.path || ''
      return
    }

    loading = true
    clearMessage()

    try {
      await client.commitFiles(repo.owner, repo.name, {
        message: `Delete ${note.path}`,
        deletions: [note.path],
      })
      await clearDraft(note.path)
      notes = notes.filter((item) => item.path !== note.path)
      selectedPath = notes[0]?.path || ''
      status = 'Deleted from GitHub.'
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }

  function copyNote(note) {
    if (!note) return

    const title = `${note.title} copy`
    const path = uniquePath(notePathFor(title), notes)
    const copy = {
      ...note,
      id: path,
      path,
      title,
      fileSha: '',
      commitSha: '',
      updatedDate: new Date().toISOString(),
      dirty: true,
    }

    notes = [copy, ...notes]
    selectedPath = path
    persistDraft(copy)
    status = 'Duplicated locally. Save to push the new file.'
  }

  async function copyToClipboard(note) {
    if (!note) return
    await navigator.clipboard.writeText(buildMarkdown(note))
    status = 'Copied note markdown to clipboard.'
  }

  async function showHistory(client, repo, note) {
    if (!client || !repo.owner || !repo.name || !note?.path) return
    loading = true
    clearMessage()

    try {
      historyBaseNote = note
      historyVersions = await client.listNoteHistory(repo.owner, repo.name, note.path)
      historyMode = true
      selectedHistoryNote = null
      status = historyVersions.length ? 'History loaded.' : 'No history for this note yet.'
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }

  async function selectHistoryVersion(client, repo, version) {
    if (!client || !repo.owner || !repo.name || !version) return
    loading = true
    clearMessage()

    try {
      const file = await client.getNoteAtCommit(repo.owner, repo.name, version.path, version.commitSha)
      selectedHistoryNote = parseNoteFile(file.path, file.markdown, {
        sha: version.commitSha,
        date: version.date,
        fileSha: file.fileSha,
      })
      status = `Viewing ${version.commitSha.slice(0, 7)}.`
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }

  function exitHistory() {
    historyMode = false
    historyBaseNote = null
    historyVersions = []
    selectedHistoryNote = null
  }

  function updateSelected(patch) {
    if (!selectedNote || selectedHistoryNote) return
    const next = { ...selectedNote, ...patch, dirty: true }
    notes = notes.map((note) => (note.path === selectedNote.path ? next : note))
    persistDraft(next)
  }

  async function addBase64Image(file) {
    if (!selectedNote || !file?.type?.startsWith('image/') || selectedHistoryNote) return

    const dataUrl = await fileToDataUrl(file)
    const name = file.name || 'image'
    updateSelected({
      body: `${selectedNote.body || ''}\n![${name}](${dataUrl})`.trim(),
    })
    status = 'Image embedded in markdown locally. Save to push it to GitHub.'
  }

  function reset() {
    notes = []
    selectedPath = ''
    exitHistory()
    clearAllDrafts()
  }

  function clearMessage() {
    error = ''
    status = ''
  }

  return {
    get notes() { return notes },
    get selectedPath() { return selectedPath },
    set selectedPath(value) { selectedPath = value },
    get selectedNote() { return selectedNote },
    get historyMode() { return historyMode },
    get historyVersions() { return historyVersions },
    get historyBaseNote() { return historyBaseNote },
    get hasDirtyDrafts() { return hasDirtyDrafts },
    get loading() { return loading },
    get status() { return status },
    get error() { return error },
    loadFromRepo,
    createNote,
    saveSelected,
    saveDirty,
    deleteNote,
    copyNote,
    copyToClipboard,
    showHistory,
    selectHistoryVersion,
    exitHistory,
    updateSelected,
    addBase64Image,
    reset,
  }
}

function mergeDrafts(remoteNotes, drafts) {
  const byPath = new Map(remoteNotes.map((note) => [note.path, note]))
  for (const draft of drafts) byPath.set(draft.path, { ...(byPath.get(draft.path) || {}), ...draft, dirty: true })
  return [...byPath.values()]
}

function ensurePathMatchesTitle(note, existingNotes) {
  if (note.commitSha) return note.path
  return uniquePath(notePathFor(note.title), existingNotes.filter((item) => item.path !== note.path))
}

function sortByUpdatedDate(a, b) {
  return new Date(b.updatedDate) - new Date(a.updatedDate)
}

function persistDraft(note) {
  saveDraft(note).catch(() => {})
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}
