<script>
  import { tick } from 'svelte'
  import { monthKey } from './calendarUtils.js'

  export let visualization = 'calendar'
  export let monthLabel = ''
  export let selectedMonth = ''
  export let groups = {}
  export let notes = []
  export let historyMode = false
  export let historyVersions = []
  export let historyBaseNote = null
  export let selectedPath = ''
  export let onToggleVisualization = () => {}
  export let onSelectMonth = () => {}
  export let onSelect = () => {}
  export let onDelete = () => {}
  export let onHistory = () => {}
  export let onSelectHistory = () => {}
  export let onExitHistory = () => {}

  let listElement
  let pickerOpen = false
  let pickerYear = new Date().getFullYear()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  $: if (selectedMonth && listElement) scrollToMonth(selectedMonth)
  $: if (selectedMonth) pickerYear = Number(selectedMonth.slice(0, 4))
  $: yearOptions = buildYearOptions(notes, selectedMonth)

  function openMonthPicker() {
    pickerOpen = !pickerOpen
  }

  function buildYearOptions(items, currentMonth) {
    const years = items
      .map((note) => new Date(note.updatedDate).getFullYear())
      .filter((year) => Number.isFinite(year))
    const currentYear = Number(currentMonth?.slice(0, 4)) || new Date().getFullYear()
    const min = Math.min(currentYear - 1, ...years)
    const max = Math.max(currentYear + 1, ...years)

    return Array.from({ length: max - min + 1 }, (_, index) => min + index)
  }

  function selectMonth(monthIndex) {
    pickerOpen = false
    onSelectMonth(`${pickerYear}-${String(monthIndex + 1).padStart(2, '0')}`)
  }

  async function scrollToMonth(month) {
    await tick()
    listElement?.querySelector(`[data-month="${month}"]`)?.scrollIntoView({ block: 'start' })
  }
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
      <button class="month-button" type="button" onclick={openMonthPicker}>{monthLabel}</button>
      <button class="icon-button" type="button" title="Future relation actions">...</button>
      {#if pickerOpen}
        <div class="month-picker" role="dialog" aria-label="Select month">
          <div class="year-row">
            <button type="button" onclick={() => (pickerYear -= 1)}>&lt;</button>
            <select bind:value={pickerYear}>
              {#each yearOptions as year}
                <option value={year}>{year}</option>
              {/each}
            </select>
            <button type="button" onclick={() => (pickerYear += 1)}>&gt;</button>
          </div>
          <div class="month-grid">
            {#each monthNames as name, index}
              <button
                class:active={selectedMonth === `${pickerYear}-${String(index + 1).padStart(2, '0')}`}
                type="button"
                onclick={() => selectMonth(index)}
              >
                {name}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>

  {#if historyMode}
    <div class="calendar-list" bind:this={listElement}>
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
    <div class="calendar-list" bind:this={listElement}>
      {#if !Object.keys(groups).length}
        <div class="empty-state">No notes in this month.</div>
      {/if}

      {#each Object.entries(groups) as [date, dateNotes]}
        <section class="date-group" data-month={monthKey(dateNotes[0]?.updatedDate)}>
          <h2>{date}</h2>
          {#each dateNotes as note}
            <article class:active={note.path === selectedPath}>
              <button class="note-select" type="button" onclick={() => onSelect(note.path)}>
                <strong>{note.title}</strong>
                <span>{note.description || note.body}</span>
              </button>
              <div class="row-actions">
                <button type="button" title="Delete file" onclick={() => onDelete(note)}>DEL</button>
                <button type="button" title="Show history diff" onclick={() => onHistory(note)}>DIFF</button>
              </div>
            </article>
          {/each}
        </section>
      {/each}
    </div>
  {/if}
</aside>
