<script>
  import { onMount } from 'svelte'
  import { createApp } from './app/createApp.svelte.js'
  import CalendarPane from './features/calendar/CalendarPane.svelte'
  import EditorPane from './features/editor/EditorPane.svelte'
  import RepoPanel from './features/repo/RepoPanel.svelte'
  import TopBar from './features/topbar/TopBar.svelte'

  const app = createApp()

  onMount(() => {
    app.initialize()
    app.syncLayoutToViewport()
    const stopAutosave = app.startAutosave()
    window.addEventListener('resize', app.syncLayoutToViewport)
    window.addEventListener('beforeunload', app.protectUnload)
    return () => {
      stopAutosave()
      window.removeEventListener('resize', app.syncLayoutToViewport)
      window.removeEventListener('beforeunload', app.protectUnload)
    }
  })
</script>

<main class:left-collapsed={app.layout.leftCollapsed} class="app-shell" style={`--left: ${app.layout.split}%`}>
  <TopBar
    search={app.calendar.search}
    token={app.repo.token}
    user={app.repo.user}
    loading={app.loading}
    syncStatus={app.syncStatus}
    syncCountdown={app.syncCountdown}
    showSyncCountdown={app.showSyncCountdown}
    leftCollapsed={app.layout.leftCollapsed}
    onToggleLeft={app.toggleLeftPanel}
    onConnect={app.repo.connect}
    onForceSync={app.forceSync}
    onSearch={(value) => (app.calendar.search = value)}
    onToggleRepo={() => (app.layout.repoOpen = !app.layout.repoOpen)}
    onToggleAi={() => (app.layout.aiOpen = !app.layout.aiOpen)}
    onToggleSettings={() => (app.layout.settingsOpen = !app.layout.settingsOpen)}
  />

  {#if app.repo.device}
    <section class="notice">
      <button class="device-code" type="button" title="Copy GitHub code" onclick={() => app.copyDeviceCode(app.repo.device.user_code)}>
        {app.repo.device.user_code}
      </button>
      <span>Open <a href={app.repo.device.verification_uri} target="_blank" rel="noreferrer">{app.repo.device.verification_uri}</a> and enter the code.</span>
    </section>
  {/if}

  {#if app.layout.repoOpen}
    <RepoPanel
      repoOwner={app.repo.repoOwner}
      repoName={app.repo.repoName}
      loading={app.loading}
      onRepoOwner={(value) => (app.repo.repoOwner = value)}
      onRepoName={(value) => (app.repo.repoName = value)}
      onUseExisting={() => app.useRepo(false)}
      onCreateIfMissing={() => app.useRepo(true)}
      onDisconnect={app.disconnect}
    />
  {/if}

  {#if app.layout.aiOpen}
    <section class="repo-panel">
      <strong>AI</strong>
      <span>Placeholder for provider/model settings. No AI calls are wired in this version.</span>
    </section>
  {/if}

  {#if app.layout.settingsOpen}
    <section class="repo-panel">
      <strong>Setting</strong>
      <label class="setting-row">
        <input type="checkbox" checked={app.autosaveEnabled} onchange={(event) => app.setAutosaveEnabled(event.currentTarget.checked)} />
        <span>Autosave to GitHub</span>
        <select onchange={(event) => app.setAutosaveMinutes(event.currentTarget.value)}>
          <option value="5" selected={app.autosaveMinutes === 5}>5 minutes</option>
          <option value="10" selected={app.autosaveMinutes === 10}>10 minutes</option>
        </select>
      </label>
      <label class="setting-row">
        <input type="checkbox" checked={app.showSyncCountdown} onchange={(event) => app.setShowSyncCountdown(event.currentTarget.checked)} />
        <span>Show sync countdown</span>
      </label>
      <label class="setting-row">
        <input type="checkbox" checked={app.showCodeLineNumbers} onchange={(event) => app.setShowCodeLineNumbers(event.currentTarget.checked)} />
        <span>Code line numbers</span>
      </label>
      <label class="setting-row">
        <input type="checkbox" checked={app.strikeCompletedTasks} onchange={(event) => app.setStrikeCompletedTasks(event.currentTarget.checked)} />
        <span>Strike completed tasks</span>
      </label>
      <label class="setting-row">
        <input type="checkbox" checked={app.showMarkdownLineNumbers} onchange={(event) => app.setShowMarkdownLineNumbers(event.currentTarget.checked)} />
        <span>Markdown line numbers</span>
      </label>
    </section>
  {/if}

  {#if app.error || app.status}
    <section class:error={app.error} class="status-line">{app.error || app.status}</section>
  {/if}

  <section class:left-collapsed={app.layout.leftCollapsed} class="workspace">
    {#if !app.layout.leftCollapsed}
      <CalendarPane
        visualization={app.calendar.visualization}
        monthLabel={app.calendar.monthLabel}
        selectedMonth={app.calendar.selectedMonth}
        groups={app.calendar.groups}
        notes={app.calendar.searchNotes}
        historyMode={app.notes.historyMode}
        historyVersions={app.notes.historyVersions}
        historyBaseNote={app.notes.historyBaseNote}
        selectedHistoryCommitSha={app.notes.selectedHistoryCommitSha}
        selectedPath={app.notes.selectedPath}
        onToggleVisualization={app.calendar.toggleVisualization}
        onSelectMonth={app.selectMonth}
        onSelect={(path) => (app.notes.selectedPath = path)}
        onDelete={(note) => app.notes.deleteNote(app.repo.client, app.repo.repo, note)}
        onHistory={(note) => app.notes.showHistory(app.repo.client, app.repo.repo, note)}
        onSelectHistory={(version) => app.notes.selectHistoryVersion(app.repo.client, app.repo.repo, version)}
        onRestoreHistory={(version) => app.notes.restoreHistoryVersion(app.repo.client, app.repo.repo, version)}
        onExitHistory={app.notes.exitHistory}
      />

      <button class="splitter" type="button" aria-label="Resize columns" onpointerdown={app.layout.beginResize}></button>
    {/if}

    <EditorPane
      selectedNote={app.notes.selectedNote}
      editorMode={app.editor.mode}
      renderedHtml={app.editor.renderedHtml}
      loading={app.loading}
      readOnly={app.notes.historyMode && !!app.notes.selectedNote}
      showCodeLineNumbers={app.showCodeLineNumbers}
      strikeCompletedTasks={app.strikeCompletedTasks}
      showMarkdownLineNumbers={app.showMarkdownLineNumbers}
      repo={app.repo.repo}
      onMode={(mode) => (app.editor.mode = mode)}
      onInsert={app.editor.insertMarkdown}
      onToggleTask={app.editor.toggleTaskAt}
      onPasteFiles={app.editor.pasteFiles}
      onSave={app.notes.saveSelected}
      onCreate={app.notes.createNote}
      onUpdateNote={app.notes.updateSelected}
    />
  </section>
</main>
