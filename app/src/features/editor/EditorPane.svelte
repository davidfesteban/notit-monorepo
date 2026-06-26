<script>
  export let selectedNote = null
  export let editorMode = 'visual'
  export let renderedHtml = ''
  export let loading = false
  export let readOnly = false
  export let repo = { owner: '', name: '' }
  export let onMode = () => {}
  export let onInsert = () => {}
  export let onToggleTask = () => {}
  export let onPasteFiles = () => {}
  export let onSave = () => {}
  export let onCreate = () => {}
  export let onUpdateNote = () => {}

  function checkboxIndex(target) {
    return [...target.closest('.markdown-preview').querySelectorAll('input[type="checkbox"]')].indexOf(target)
  }

  function handlePreviewChange(event) {
    if (readOnly || !(event.target instanceof HTMLInputElement) || event.target.type !== 'checkbox') return
    onToggleTask(checkboxIndex(event.target), event.target.checked)
  }

  function handlePaste(event) {
    if (readOnly || !selectedNote) return

    const files = clipboardFiles(event.clipboardData)
    if (!files.some((file) => file.type.startsWith('image/'))) return

    event.preventDefault()
    onPasteFiles(files)
  }

  function clipboardFiles(clipboardData) {
    const files = [...(clipboardData?.files || [])]
    const itemFiles = [...(clipboardData?.items || [])]
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter(Boolean)

    return [...files, ...itemFiles]
  }
</script>

<svelte:window onpaste={handlePaste} />

<section class="editor-pane">
  <header class="editor-toolbar">
    <div class="mode-switch">
      <button class:active={editorMode === 'visual'} type="button" onclick={() => onMode('visual')}>Visual</button>
      <button class:active={editorMode === 'markdown'} type="button" onclick={() => onMode('markdown')}>Markdown</button>
    </div>

    <div class="tools">
      <button type="button" onclick={() => onInsert('# ', '', 'Heading')} disabled={readOnly}>H1</button>
      <button type="button" onclick={() => onInsert('## ', '', 'Heading')} disabled={readOnly}>H2</button>
      <button type="button" onclick={() => onInsert('', '', 'Normal text')} disabled={readOnly}>Aa</button>
      <button type="button" onclick={() => onInsert('- ', '', 'Bullet')} disabled={readOnly}>•</button>
      <button type="button" onclick={() => onInsert('- [ ] ', '', 'Task')} disabled={readOnly}>☐</button>
      <button type="button" onclick={() => onInsert('| A | B |\\n| --- | --- |\\n| 1 | 2 |')} disabled={readOnly}>Table</button>
      <button type="button" onclick={() => onInsert('```mermaid\\n', '\\n```', 'graph TD;\\n  A-->B')} disabled={readOnly}>Diagram</button>
    </div>

    <button class="save-button" type="button" onclick={onSave} disabled={loading || !selectedNote || readOnly}>Save</button>
  </header>

  {#if selectedNote}
    <div class="title-row">
      <input value={selectedNote.title} disabled={readOnly} oninput={(event) => onUpdateNote({ title: event.currentTarget.value })} />
      <input value={selectedNote.description} disabled={readOnly} placeholder="Description" oninput={(event) => onUpdateNote({ description: event.currentTarget.value })} />
    </div>

    {#if editorMode === 'markdown'}
      <textarea
        class="markdown-editor"
        readonly={readOnly}
        value={selectedNote.body}
        oninput={(event) => onUpdateNote({ body: event.currentTarget.value })}
      ></textarea>
    {:else}
      <div class="preview-frame">
        <div class="markdown-preview" onchange={handlePreviewChange}>{@html renderedHtml}</div>
      </div>
    {/if}
  {:else}
    <div class="editor-empty">
      <h1>No note selected</h1>
      <p>Connect GitHub, choose a repo, or create a local note.</p>
    </div>
  {/if}

  <footer class="editor-footer">
    <button type="button" onclick={onCreate}>New note</button>
    <span>{repo.owner && repo.name ? `${repo.owner}/${repo.name} · master` : 'No repo selected'}</span>
    {#if readOnly}<span>History view</span>{/if}
    {#if selectedNote?.commitSha}<span>{selectedNote.commitSha.slice(0, 7)}</span>{/if}
  </footer>
</section>
