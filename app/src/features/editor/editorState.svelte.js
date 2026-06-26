import { tick } from 'svelte'
import { renderMarkdown, toggleTask } from '../../shared/markdown/markdown.js'

export function createEditorState(notesState) {
  let mode = $state('visual')
  let mermaidApi = null
  let error = $state('')

  const renderedHtml = $derived(renderMarkdown(notesState.selectedNote?.body || ''))

  $effect(() => {
    if (renderedHtml && mode === 'visual') renderMermaid()
  })

  function insertMarkdown(before, after = '', placeholder = '') {
    if (!notesState.selectedNote) return
    const body = notesState.selectedNote.body
    const insertion = `${before}${placeholder}${after}`
    notesState.updateSelected({ body: body ? `${body}\n${insertion}` : insertion })
    mode = 'markdown'
  }

  function toggleTaskAt(index, checked) {
    if (!notesState.selectedNote) return
    notesState.updateSelected({ body: toggleTask(notesState.selectedNote.body, index, checked) })
  }

  async function pasteFiles(files) {
    const images = [...files].filter((file) => file.type.startsWith('image/'))
    for (const image of images) await notesState.addBase64Image(image)
    if (images.length) mode = 'markdown'
  }

  async function renderMermaid() {
    await tick()
    const nodes = document.querySelectorAll('.mermaid')
    if (!nodes.length) return

    try {
      if (!mermaidApi) {
        mermaidApi = (await import('mermaid')).default
        mermaidApi.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'strict',
          themeVariables: {
            primaryColor: '#f4f6fb',
            primaryTextColor: '#0e1525',
            primaryBorderColor: '#244c8a',
            lineColor: '#244c8a',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          },
        })
      }

      let index = 0
      for (const node of nodes) {
        if (node.dataset.rendered === 'true') continue

        const source = node.dataset.source || node.textContent
        const { svg } = await mermaidApi.render(`notit-mermaid-${Date.now()}-${index}`, source)
        node.innerHTML = svg
        node.dataset.rendered = 'true'
        index += 1
      }
      error = ''
    } catch {
      error = 'Mermaid diagram could not render. Markdown source is still saved.'
    }
  }

  return {
    get mode() { return mode },
    set mode(value) { mode = value },
    get renderedHtml() { return renderedHtml },
    get error() { return error },
    insertMarkdown,
    toggleTaskAt,
    pasteFiles,
  }
}
