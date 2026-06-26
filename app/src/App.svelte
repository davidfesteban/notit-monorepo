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
    const stopAutosave = app.startAutosave()
    window.addEventListener('beforeunload', app.protectUnload)
    return () => {
      stopAutosave()
      window.removeEventListener('beforeunload', app.protectUnload)
    }
  })
</script>

<main class="app-shell" style={`--left: ${app.layout.split}%`}>
  <TopBar
    search={app.calendar.search}
    token={app.repo.token}
    user={app.repo.user}
    loading={app.loading}
    onConnect={app.repo.connect}
    onSearch={(value) => (app.calendar.search = value)}
    onToggleRepo={() => (app.layout.repoOpen = !app.layout.repoOpen)}
    onToggleAi={() => (app.layout.aiOpen = !app.layout.aiOpen)}
  />

  {#if app.repo.device}
    <section class="notice">
      <strong>{app.repo.device.user_code}</strong>
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
      <strong>AI Settings</strong>
      <span>Placeholder for provider/model settings. No AI calls are wired in this version.</span>
      <label class="setting-check">
        <input type="checkbox" checked={app.autosaveEnabled} onchange={(event) => app.setAutosaveEnabled(event.currentTarget.checked)} />
        <span>Autosave every 5 minutes</span>
      </label>
    </section>
  {/if}

  {#if app.error || app.status}
    <section class:error={app.error} class="status-line">{app.error || app.status}</section>
  {/if}

  <section class="workspace">
    <CalendarPane
      visualization={app.calendar.visualization}
      monthLabel={app.calendar.monthLabel}
      groups={app.calendar.groups}
      notes={app.calendar.filteredNotes}
      historyMode={app.notes.historyMode}
      historyVersions={app.notes.historyVersions}
      historyBaseNote={app.notes.historyBaseNote}
      selectedPath={app.notes.selectedPath}
      onToggleVisualization={app.calendar.toggleVisualization}
      onSelect={(path) => (app.notes.selectedPath = path)}
      onDuplicate={app.notes.copyNote}
      onCopyToClipboard={app.notes.copyToClipboard}
      onDelete={(note) => app.notes.deleteNote(app.repo.client, app.repo.repo, note)}
      onHistory={(note) => app.notes.showHistory(app.repo.client, app.repo.repo, note)}
      onSelectHistory={(version) => app.notes.selectHistoryVersion(app.repo.client, app.repo.repo, version)}
      onExitHistory={app.notes.exitHistory}
    />

    <button class="splitter" type="button" aria-label="Resize columns" onpointerdown={app.layout.beginResize}></button>

    <EditorPane
      selectedNote={app.notes.selectedNote}
      editorMode={app.editor.mode}
      renderedHtml={app.editor.renderedHtml}
      loading={app.loading}
      readOnly={app.notes.historyMode && !!app.notes.selectedNote}
      repo={app.repo.repo}
      onMode={(mode) => (app.editor.mode = mode)}
      onInsert={app.editor.insertMarkdown}
      onToggleTask={app.editor.toggleTaskAt}
      onPasteFiles={app.editor.pasteFiles}
      onSave={() => app.notes.saveSelected(app.repo.client, app.repo.repo)}
      onCreate={app.notes.createNote}
      onUpdateNote={app.notes.updateSelected}
    />
  </section>
</main>
