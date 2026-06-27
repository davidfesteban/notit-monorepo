<script>
  export let selectedNote = null
  export let editorMode = 'visual'
  export let renderedHtml = ''
  export let loading = false
  export let readOnly = false
  export let showCodeLineNumbers = true
  export let strikeCompletedTasks = true
  export let showMarkdownLineNumbers = true
  export let repo = { owner: '', name: '' }
  export let onMode = () => {}
  export let onInsert = () => {}
  export let onToggleTask = () => {}
  export let onPasteFiles = () => {}
  export let onSave = () => {}
  export let onCreate = () => {}
  export let onUpdateNote = () => {}

  let textareaElement
  let lineGutterElement
  let toolMenuElement
  let toolMenuOpen = false

  function insert(before, after = '', placeholder = '') {
    const selection =
      editorMode === 'markdown' && textareaElement
        ? { start: textareaElement.selectionStart, end: textareaElement.selectionEnd }
        : null

    onInsert(before, after, placeholder, selection)

    if (!selection) return

    requestAnimationFrame(() => {
      const cursor = selection.start + before.length + placeholder.length
      textareaElement?.focus()
      textareaElement?.setSelectionRange(cursor, cursor)
    })
  }

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

  function lineCount(value) {
    return String(value || '').split('\n').length
  }

  function syncEditorScroll() {
    if (lineGutterElement && textareaElement) lineGutterElement.scrollTop = textareaElement.scrollTop
  }

  function closeToolMenuOnOutsidePointer(event) {
    if (!toolMenuOpen || toolMenuElement?.contains(event.target)) return
    toolMenuOpen = false
  }
</script>

<svelte:window onpaste={handlePaste} onpointerdown={closeToolMenuOnOutsidePointer} />

<section class="editor-pane">
  <header class="editor-toolbar">
    <div class="mode-switch">
      <button class:active={editorMode === 'visual'} type="button" onclick={() => onMode('visual')}>Visual</button>
      <button class:active={editorMode === 'markdown'} type="button" onclick={() => onMode('markdown')}>Markdown</button>
    </div>

    <div class="tools">
      <button type="button" onclick={() => insert('# ', '', 'Heading')} disabled={readOnly}>H1</button>
      <button type="button" onclick={() => insert('## ', '', 'Heading')} disabled={readOnly}>H2</button>
      <button type="button" onclick={() => insert('', '', 'Normal text')} disabled={readOnly}>Aa</button>
      <button type="button" onclick={() => insert('- ', '', 'Bullet')} disabled={readOnly}>•</button>
      <button type="button" onclick={() => insert('- [ ] ', '', 'Task')} disabled={readOnly}>☐</button>
      <button type="button" onclick={() => insert('| A | B |\n| --- | --- |\n| 1 | 2 |')} disabled={readOnly}>Table</button>
      <button type="button" onclick={() => insert('```notit-table\n', '\n```', 'a,b,c\n1,2,3\n4,5,6')} disabled={readOnly}>TableV2</button>
      <button type="button" onclick={() => insert('```mermaid\n', '\n```', 'flowchart TD\n  A --> B')} disabled={readOnly}>Diagram</button>
      <button type="button" onclick={() => insert('```notit-code title=\"Code\"\n', '\n```', 'console.log(\"later\")')} disabled={readOnly}>Code</button>
    </div>

    <details class="tool-menu" bind:this={toolMenuElement} bind:open={toolMenuOpen}>
      <summary>Tools</summary>
      <div class="tool-menu-items">
        <button type="button" onclick={() => insert('# ', '', 'Heading')} disabled={readOnly}>H1</button>
        <button type="button" onclick={() => insert('## ', '', 'Heading')} disabled={readOnly}>H2</button>
        <button type="button" onclick={() => insert('', '', 'Normal text')} disabled={readOnly}>Aa</button>
        <button type="button" onclick={() => insert('- ', '', 'Bullet')} disabled={readOnly}>•</button>
        <button type="button" onclick={() => insert('- [ ] ', '', 'Task')} disabled={readOnly}>☐</button>
        <button type="button" onclick={() => insert('| A | B |\n| --- | --- |\n| 1 | 2 |')} disabled={readOnly}>Table</button>
        <button type="button" onclick={() => insert('```notit-table\n', '\n```', 'a,b,c\n1,2,3\n4,5,6')} disabled={readOnly}>TableV2</button>
        <button type="button" onclick={() => insert('```mermaid\n', '\n```', 'flowchart TD\n  A --> B')} disabled={readOnly}>Diagram</button>
        <button type="button" onclick={() => insert('```notit-code title=\"Code\"\n', '\n```', 'console.log(\"later\")')} disabled={readOnly}>Code</button>
      </div>
    </details>

    <button class="save-button" type="button" onclick={onSave} disabled={loading || !selectedNote || readOnly}>Save</button>
  </header>

  {#if selectedNote}
    <div class="title-row">
      <input value={selectedNote.title} disabled={readOnly} oninput={(event) => onUpdateNote({ title: event.currentTarget.value })} />
      <input value={selectedNote.description} disabled={readOnly} placeholder="Description" oninput={(event) => onUpdateNote({ description: event.currentTarget.value })} />
    </div>

    {#if editorMode === 'markdown'}
      <div class:show-markdown-lines={showMarkdownLineNumbers} class="markdown-editor-frame">
        {#if showMarkdownLineNumbers}
          <div class="markdown-line-gutter" bind:this={lineGutterElement}>
            {#each Array(lineCount(selectedNote.body)) as _, index}
              <span>{index + 1}</span>
            {/each}
          </div>
        {/if}
        <textarea
          bind:this={textareaElement}
          class="markdown-editor"
          readonly={readOnly}
          value={selectedNote.body}
          oninput={(event) => onUpdateNote({ body: event.currentTarget.value })}
          onscroll={syncEditorScroll}
        ></textarea>
      </div>
    {:else}
      <div class="preview-frame">
        <div
          class:show-code-lines={showCodeLineNumbers}
          class:strike-tasks={strikeCompletedTasks}
          class="markdown-preview"
          onchange={handlePreviewChange}
        >{@html renderedHtml}</div>
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
