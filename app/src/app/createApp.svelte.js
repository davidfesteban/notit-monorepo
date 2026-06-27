import { createCalendarState } from '../features/calendar/calendarState.svelte.js'
import { createEditorState } from '../features/editor/editorState.svelte.js'
import { createLayoutState } from '../features/layout/layoutState.svelte.js'
import { createNotesState } from '../features/notes/notesState.svelte.js'
import { createRepoState } from '../features/repo/repoState.svelte.js'
import { loadSession, saveSettings } from '../shared/storage/sessionStorage.js'

export function createApp({ demo = false } = {}) {
  const session = loadSession()
  const repo = createRepoState()
  const notes = createNotesState({ demo })
  const calendar = createCalendarState(notes)
  const editor = createEditorState(notes)
  const layout = createLayoutState()
  let autosaveEnabled = $state(session.settings?.autosaveEnabled !== false)
  let autosaveMinutes = $state(session.settings?.autosaveMinutes || 5)
  let showSyncCountdown = $state(session.settings?.showSyncCountdown !== false)
  let showCodeLineNumbers = $state(session.settings?.showCodeLineNumbers !== false)
  let strikeCompletedTasks = $state(session.settings?.strikeCompletedTasks !== false)
  let showMarkdownLineNumbers = $state(session.settings?.showMarkdownLineNumbers !== false)
  let theme = $state(normalizeTheme(session.settings?.theme))
  let syncRemainingSeconds = $state((session.settings?.autosaveMinutes || 5) * 60)
  let autosaveTimer = null
  let demoTimer = null
  let demoStep = 0
  let demoPaused = $state(false)
  let dismissedNotice = $state('')
  let syncing = false

  const loading = $derived(repo.loading || notes.loading)
  const status = $derived(demoPaused ? 'Demo paused. Click empty workspace to restart.' : notes.status || repo.status)
  const error = $derived(editor.error || notes.error || repo.error)
  const noticeMessage = $derived(error || status)
  const noticeVisible = $derived(!!noticeMessage && noticeMessage !== dismissedNotice)

  async function initialize() {
    if (demo) {
      notes.seedDemoNotes()
      return
    }

    await notes.loadLocalDrafts()
    await repo.loadViewer()
    await notes.loadFromRepo(repo.client, repo.repo)
    queueLocalDraftsWhenRepoReady()
  }

  async function useRepo(createIfMissing) {
    const selectedRepo = await repo.useRepo(createIfMissing)
    if (!selectedRepo) return
    layout.repoOpen = false
    await notes.loadFromRepo(repo.client, repo.repo)
    queueLocalDraftsWhenRepoReady()
  }

  function queueLocalDraftsWhenRepoReady() {
    if (!repo.client || !repo.repo.owner || !repo.repo.name) return
    notes.queueLocalDraftsForSync()
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

  function setTheme(value) {
    theme = normalizeTheme(value)
    persistSettings()
  }

  function persistSettings() {
    if (demo) return
    saveSettings({
      autosaveEnabled,
      autosaveMinutes,
      showSyncCountdown,
      showCodeLineNumbers,
      strikeCompletedTasks,
      showMarkdownLineNumbers,
      theme,
    })
  }

  function startAutosave() {
    if (demo) return () => {}
    stopAutosave()
    syncRemainingSeconds = autosaveMinutes * 60
    autosaveTimer = setInterval(tickAutosave, 1000)
    return stopAutosave
  }

  async function forceSync() {
    if (demo) return
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
    if (demo) return
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

  function syncLayoutToViewport() {
    layout.syncViewport(window.innerWidth)
  }

  function toggleLeftPanel() {
    if (layout.isMobile) {
      layout.toggleMobileView()
      return
    }

    const showList = layout.leftCollapsed
    layout.setLeftCollapsed(!showList)
  }

  function selectNote(path) {
    notes.selectedPath = path
    layout.showMobileEditor()
  }

  function createNote() {
    notes.createNote()
    layout.showMobileEditor()
  }

  async function selectHistoryVersion(version) {
    await notes.selectHistoryVersion(repo.client, repo.repo, version)
    layout.showMobileEditor()
  }

  function startDemo() {
    if (!demo || demoTimer) return stopDemo
    demoPaused = false
    runDemoStep()
    demoTimer = setInterval(runDemoStep, 950)
    return stopDemo
  }

  function stopDemo() {
    if (!demoTimer) return
    clearInterval(demoTimer)
    demoTimer = null
  }

  function pauseDemo() {
    if (!demo) return
    stopDemo()
    demoPaused = true
  }

  function resumeDemoFromEmptySpace(event) {
    if (!demo || !demoPaused || demoTimer) return
    if (event?.target?.closest?.('button, a, input, textarea, select, summary, label, .repo-panel, .notice')) return
    demoStep = 0
    startDemo()
  }

  function closeTransientPanels(event) {
    if (event?.target?.closest?.('.topbar, .repo-panel, .notice, .modal-backdrop')) return
    layout.repoOpen = false
    layout.aiOpen = false
    layout.settingsOpen = false
  }

  function dismissNotice() {
    dismissedNotice = noticeMessage
  }

  function runDemoStep() {
    const steps = [
      resetDemo,
      () => setTheme('notit-dark'),
      () => setTheme('zed-slim'),
      () => setTheme('retro'),
      () => layout.setLeftCollapsed(true),
      () => {
        createNote()
        editor.mode = 'markdown'
        notes.updateSelected({
          title: 'AI launch note',
          description: 'Written in Markdown',
          body: '# AI launch note\n\n- [ ] Ship Mac app\n- [ ] Submit iOS build\n\n```mermaid\nflowchart LR\n  Notit --> GitHub\n  GitHub --> ChatGPT\n```',
        })
      },
      () => setTheme('notit-dark'),
      () => { editor.mode = 'visual' },
      () => layout.setLeftCollapsed(false),
      () => {
        layout.aiOpen = true
        layout.settingsOpen = false
      },
      () => {
        layout.aiOpen = false
        layout.settingsOpen = true
      },
      () => {
        autosaveEnabled = false
        showSyncCountdown = false
        showCodeLineNumbers = false
        strikeCompletedTasks = false
        showMarkdownLineNumbers = false
      },
    ]

    steps[demoStep % steps.length]()
    demoStep += 1
  }

  function resetDemo() {
    notes.seedDemoNotes()
    editor.mode = 'visual'
    setTheme('retro')
    layout.setLeftCollapsed(false)
    layout.mobileView = 'editor'
    layout.aiOpen = false
    layout.repoOpen = false
    layout.settingsOpen = false
    demoPaused = false
    autosaveEnabled = true
    showSyncCountdown = true
    showCodeLineNumbers = true
    strikeCompletedTasks = true
    showMarkdownLineNumbers = true
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
    demoMode: demo,
    get demoPaused() { return demoPaused },
    get autosaveEnabled() { return autosaveEnabled },
    get autosaveMinutes() { return autosaveMinutes },
    get showSyncCountdown() { return showSyncCountdown },
    get showCodeLineNumbers() { return showCodeLineNumbers },
    get strikeCompletedTasks() { return strikeCompletedTasks },
    get showMarkdownLineNumbers() { return showMarkdownLineNumbers },
    get theme() { return theme },
    get syncStatus() { return notes.hasPendingGithubChanges ? 'Unsync' : 'Synced' },
    get syncCountdown() { return formatSyncCountdown() },
    setAutosaveEnabled,
    setAutosaveMinutes,
    setShowSyncCountdown,
    setShowCodeLineNumbers,
    setStrikeCompletedTasks,
    setShowMarkdownLineNumbers,
    setTheme,
    forceSync,
    selectMonth,
    selectNote,
    createNote,
    selectHistoryVersion,
    copyDeviceCode,
    syncLayoutToViewport,
    toggleLeftPanel,
    get loading() { return loading },
    get status() { return status },
    get error() { return error },
    get noticeMessage() { return noticeMessage },
    get noticeVisible() { return noticeVisible },
    get noticeIsError() { return !!error },
    dismissNotice,
    initialize,
    startAutosave,
    startDemo,
    stopDemo,
    pauseDemo,
    resumeDemoFromEmptySpace,
    closeTransientPanels,
    stopAutosave,
    protectUnload,
    useRepo,
    disconnect,
  }
}

function normalizeTheme(value) {
  return ['retro', 'notit-dark', 'zed-slim'].includes(value) ? value : 'retro'
}
