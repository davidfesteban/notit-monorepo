<script>
  export let visualization = 'calendar'
  export let monthLabel = ''
  export let groups = {}
  export let notes = []
  export let historyMode = false
  export let historyVersions = []
  export let historyBaseNote = null
  export let selectedPath = ''
  export let onToggleVisualization = () => {}
  export let onSelect = () => {}
  export let onDuplicate = () => {}
  export let onCopyToClipboard = () => {}
  export let onDelete = () => {}
  export let onHistory = () => {}
  export let onSelectHistory = () => {}
  export let onExitHistory = () => {}
</script>

<aside class="calendar-pane">
  <div class="calendar-toolbar">
    {#if historyMode}
      <button class="mode-button" type="button">History</button>
      <button class="month-button" type="button">{historyBaseNote?.title || 'Note history'}</button>
      <button class="icon-button" type="button" title="Exit history" onclick={onExitHistory}>X</button>
    {:else}
      <button class="mode-button" type="button" onclick={onToggleVisualization}>
        {visualization === 'calendar' ? 'Calendar' : 'Constellation'}
      </button>
      <button class="month-button" type="button">{monthLabel}</button>
      <button class="icon-button" type="button" title="Bulk actions">...</button>
    {/if}
  </div>

  {#if historyMode}
    <div class="calendar-list">
      {#if !historyVersions.length}
        <div class="empty-state">No saved versions yet.</div>
      {/if}

      <section class="date-group">
        <h2>Previous commits</h2>
        {#each historyVersions as version}
          <article>
            <button class="note-select" type="button" onclick={() => onSelectHistory(version)}>
              <strong>{version.date ? new Date(version.date).toLocaleString() : version.commitSha.slice(0, 7)}</strong>
              <span>{version.message || version.commitSha}</span>
            </button>
          </article>
        {/each}
      </section>
    </div>
  {:else if visualization === 'constellation'}
    <div class="empty-state">Constellation comes later. Calendar is active for v1.</div>
  {:else}
    <div class="calendar-list">
      {#if !notes.length}
        <div class="empty-state">No notes yet.</div>
      {/if}

      {#each Object.entries(groups) as [date, dateNotes]}
        <section class="date-group">
          <h2>{date}</h2>
          {#each dateNotes as note}
            <article class:active={note.path === selectedPath}>
              <button class="note-select" type="button" onclick={() => onSelect(note.path)}>
                <strong>{note.title}</strong>
                <span>{note.description || note.body}</span>
              </button>
              <div class="row-actions">
                <button type="button" title="Delete file" onclick={() => onDelete(note)}>DEL</button>
                <button type="button" title="Duplicate file" onclick={() => onDuplicate(note)}>DUPLICATE</button>
                <button type="button" title="Copy markdown to clipboard" onclick={() => onCopyToClipboard(note)}>COPY-TO-CLIPBOARD</button>
                <button type="button" title="Show history" onclick={() => onHistory(note)}>History</button>
              </div>
            </article>
          {/each}
        </section>
      {/each}
    </div>
  {/if}
</aside>
