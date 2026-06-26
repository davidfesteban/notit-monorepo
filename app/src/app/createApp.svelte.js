import { createCalendarState } from '../features/calendar/calendarState.svelte.js'
import { createEditorState } from '../features/editor/editorState.svelte.js'
import { createLayoutState } from '../features/layout/layoutState.svelte.js'
import { createNotesState } from '../features/notes/notesState.svelte.js'
import { createRepoState } from '../features/repo/repoState.svelte.js'
import { loadSession, saveSettings } from '../shared/storage/sessionStorage.js'

export function createApp() {
  const session = loadSession()
  const repo = createRepoState()
  const notes = createNotesState()
  const calendar = createCalendarState(notes)
  const editor = createEditorState(notes)
  const layout = createLayoutState()
  let autosaveEnabled = $state(session.settings?.autosaveEnabled !== false)
  let autosaveTimer = null

  const loading = $derived(repo.loading || notes.loading)
  const status = $derived(notes.status || repo.status)
  const error = $derived(editor.error || notes.error || repo.error)

  async function initialize() {
    await repo.loadViewer()
    await notes.loadFromRepo(repo.client, repo.repo)
  }

  async function useRepo(createIfMissing) {
    const selectedRepo = await repo.useRepo(createIfMissing)
    if (!selectedRepo) return
    layout.repoOpen = false
    await notes.loadFromRepo(repo.client, repo.repo)
  }

  function disconnect() {
    repo.disconnect()
    notes.reset()
  }

  function setAutosaveEnabled(value) {
    autosaveEnabled = value
    saveSettings({ autosaveEnabled })
  }

  function startAutosave() {
    stopAutosave()
    autosaveTimer = setInterval(() => {
      if (autosaveEnabled) notes.saveDirty(repo.client, repo.repo, 'autosave')
    }, 5 * 60 * 1000)
    return stopAutosave
  }

  function stopAutosave() {
    if (!autosaveTimer) return
    clearInterval(autosaveTimer)
    autosaveTimer = null
  }

  function protectUnload(event) {
    if (!notes.hasDirtyDrafts) return
    event.preventDefault()
    event.returnValue = ''
  }

  return {
    repo,
    notes,
    calendar,
    editor,
    layout,
    get autosaveEnabled() { return autosaveEnabled },
    setAutosaveEnabled,
    get loading() { return loading },
    get status() { return status },
    get error() { return error },
    initialize,
    startAutosave,
    stopAutosave,
    protectUnload,
    useRepo,
    disconnect,
  }
}
