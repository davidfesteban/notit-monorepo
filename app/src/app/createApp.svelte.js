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
  let autosaveMinutes = $state(session.settings?.autosaveMinutes || 5)
  let showSyncCountdown = $state(session.settings?.showSyncCountdown !== false)
  let showCodeLineNumbers = $state(session.settings?.showCodeLineNumbers !== false)
  let strikeCompletedTasks = $state(session.settings?.strikeCompletedTasks !== false)
  let showMarkdownLineNumbers = $state(session.settings?.showMarkdownLineNumbers !== false)
  let syncRemainingSeconds = $state((session.settings?.autosaveMinutes || 5) * 60)
  let autosaveTimer = null
  let syncing = false

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
    persistSettings()
    startAutosave()
  }

  function setAutosaveMinutes(value) {
    autosaveMinutes = Number(value) === 10 ? 10 : 5
    syncRemainingSeconds = autosaveMinutes * 60
    persistSettings()
    startAutosave()
  }

  function setShowSyncCountdown(value) {
    showSyncCountdown = value
    persistSettings()
  }

  function setShowCodeLineNumbers(value) {
    showCodeLineNumbers = value
    persistSettings()
  }

  function setStrikeCompletedTasks(value) {
    strikeCompletedTasks = value
    persistSettings()
  }

  function setShowMarkdownLineNumbers(value) {
    showMarkdownLineNumbers = value
    persistSettings()
  }

  function persistSettings() {
    saveSettings({
      autosaveEnabled,
      autosaveMinutes,
      showSyncCountdown,
      showCodeLineNumbers,
      strikeCompletedTasks,
      showMarkdownLineNumbers,
    })
  }

  function startAutosave() {
    stopAutosave()
    syncRemainingSeconds = autosaveMinutes * 60
    autosaveTimer = setInterval(tickAutosave, 1000)
    return stopAutosave
  }

  async function forceSync() {
    if (syncing) return
    syncing = true
    syncRemainingSeconds = autosaveMinutes * 60
    try {
      await notes.syncPending(repo.client, repo.repo, 'manual')
    } finally {
      syncing = false
    }
  }

  async function tickAutosave() {
    if (!autosaveEnabled || !notes.hasPendingGithubChanges) {
      syncRemainingSeconds = autosaveMinutes * 60
      return
    }

    syncRemainingSeconds = Math.max(0, syncRemainingSeconds - 1)
    if (syncRemainingSeconds > 0 || syncing) return

    syncing = true
    try {
      await notes.syncPending(repo.client, repo.repo, 'autosave')
    } finally {
      syncing = false
    }
    syncRemainingSeconds = autosaveMinutes * 60
  }

  function stopAutosave() {
    if (!autosaveTimer) return
    clearInterval(autosaveTimer)
    autosaveTimer = null
  }

  function protectUnload(event) {
    if (!notes.hasPendingGithubChanges) return
    event.preventDefault()
    event.returnValue = ''
  }

  function selectMonth(month) {
    calendar.selectedMonth = month
    notes.selectedPath = calendar.filteredNotes[0]?.path || '__notit_empty_month__'
  }

  async function copyDeviceCode(code) {
    if (!code) return
    await navigator.clipboard.writeText(code)
    repo.setStatus('GitHub code copied.')
  }

  function formatSyncCountdown() {
    if (!autosaveEnabled) return 'paused'
    const minutes = Math.floor(syncRemainingSeconds / 60)
    const seconds = String(syncRemainingSeconds % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  }

  return {
    repo,
    notes,
    calendar,
    editor,
    layout,
    get autosaveEnabled() { return autosaveEnabled },
    get autosaveMinutes() { return autosaveMinutes },
    get showSyncCountdown() { return showSyncCountdown },
    get showCodeLineNumbers() { return showCodeLineNumbers },
    get strikeCompletedTasks() { return strikeCompletedTasks },
    get showMarkdownLineNumbers() { return showMarkdownLineNumbers },
    get syncStatus() { return notes.hasPendingGithubChanges ? 'Unsync' : 'Synced' },
    get syncCountdown() { return formatSyncCountdown() },
    setAutosaveEnabled,
    setAutosaveMinutes,
    setShowSyncCountdown,
    setShowCodeLineNumbers,
    setStrikeCompletedTasks,
    setShowMarkdownLineNumbers,
    forceSync,
    selectMonth,
    copyDeviceCode,
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
