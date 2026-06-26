<script>
  const notes = [
    {
      id: 1,
      title: 'Project outline',
      body: 'Shape the first Notit experience around fast capture, clean reading, and reliable sync later.',
      updatedAt: 'Today',
      tags: ['Product', 'Draft'],
    },
    {
      id: 2,
      title: 'Apple app polish',
      body: 'Keep navigation native-feeling on iPhone, iPad, and macOS. Prioritize keyboard shortcuts after the editor settles.',
      updatedAt: 'Yesterday',
      tags: ['Apple'],
    },
    {
      id: 3,
      title: 'Backend later',
      body: 'Start local-first. Add backend services only when accounts, sharing, or sync need a server.',
      updatedAt: 'Jun 26',
      tags: ['Architecture'],
    },
  ]

  let selectedNote = $state(notes[0])
</script>

<main class="shell">
  <aside class="sidebar" aria-label="Notes">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true">N</div>
      <div>
        <h1>Notit</h1>
        <p>Notes</p>
      </div>
    </div>

    <button class="new-note" type="button">New note</button>

    <nav class="note-list" aria-label="Note list">
      {#each notes as note}
        <button
          class:active={note.id === selectedNote.id}
          type="button"
          onclick={() => (selectedNote = note)}
        >
          <span>{note.title}</span>
          <small>{note.updatedAt}</small>
        </button>
      {/each}
    </nav>
  </aside>

  <section class="editor" aria-label="Selected note">
    <header class="editor-header">
      <div>
        <p class="eyebrow">Workspace</p>
        <h2>{selectedNote.title}</h2>
      </div>
      <button type="button">Share</button>
    </header>

    <div class="tags" aria-label="Tags">
      {#each selectedNote.tags as tag}
        <span>{tag}</span>
      {/each}
    </div>

    <textarea bind:value={selectedNote.body} aria-label="Note body"></textarea>
  </section>

  <aside class="detail" aria-label="Note details">
    <section>
      <h2>Details</h2>
      <dl>
        <div>
          <dt>Updated</dt>
          <dd>{selectedNote.updatedAt}</dd>
        </div>
        <div>
          <dt>Words</dt>
          <dd>{selectedNote.body.trim().split(/\s+/).filter(Boolean).length}</dd>
        </div>
      </dl>
    </section>

    <section>
      <h2>Next</h2>
      <p>Local storage, search, and real note creation can be added once the product shape is clearer.</p>
    </section>
  </aside>
</main>
