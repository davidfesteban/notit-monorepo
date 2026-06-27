<script>
  export let repo = { owner: '', name: '' }

  let modalOpen = false

  const gptUrl = 'https://chatgpt.com/g/g-6a3f9ccb01008191be91c471e86a2225-notit'

  $: repoLabel = repo.owner && repo.name ? `${repo.owner}/${repo.name}` : 'your Notit notes repo'
  $: prompt = `Use GitHub. Read my Notit notes from ${repoLabel}. Notes live in notes/*.md. Follow AGENTS.md in that repo.`

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt)
  }

  function closeOnEscape(event) {
    if (modalOpen && event.key === 'Escape') {
      modalOpen = false
    }
  }
</script>

<svelte:window onkeydown={closeOnEscape} />

<section class="repo-panel ai-panel">
  <div class="ai-heading">
    <img src="./notit_gpt_icon.png" alt="" />
    <div>
      <strong>AI</strong>
      <span>Use the Notit GPT with GitHub as the connector. No Notit backend required.</span>
    </div>
  </div>

  <div class="ai-actions">
    <a class="top-action" href={gptUrl} target="_blank" rel="noreferrer">Open Notit GPT</a>
    <button type="button" onclick={() => (modalOpen = true)}>Instructions</button>
  </div>
</section>

{#if modalOpen}
  <div class="modal-backdrop">
    <button class="modal-hitbox" type="button" aria-label="Close instructions" onclick={() => (modalOpen = false)}></button>
    <div class="notit-modal" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
      <header>
        <div>
          <p class="modal-kicker">CHATGPT / CODEX</p>
          <h2 id="ai-modal-title">Connect Notit to AI</h2>
        </div>
        <button type="button" aria-label="Close" onclick={() => (modalOpen = false)}>X</button>
      </header>

      <div class="modal-grid">
        <article>
          <h3>ChatGPT mobile / web</h3>
          <ol>
            <li>Open the Notit GPT.</li>
            <li>Connect ChatGPT to GitHub.</li>
            <li>Give access to {repoLabel}.</li>
            <li>Use the prompt below when needed.</li>
          </ol>
          <a href={gptUrl} target="_blank" rel="noreferrer">Open GPT</a>
        </article>

        <article>
          <h3>Codex desktop</h3>
          <ol>
            <li>Clone your Notit notes repo locally.</li>
            <li>Run the local Notit MCP server.</li>
            <li>Add it to Codex with `codex mcp add notit`.</li>
          </ol>
          <code>NOTIT_REPO_DIR=/path/to/notes npm run mcp:notit</code>
        </article>
      </div>

      <label class="prompt-box">
        <span>Starter prompt</span>
        <textarea readonly value={prompt}></textarea>
      </label>

      <footer>
        <button type="button" onclick={copyPrompt}>Copy prompt</button>
        <button type="button" onclick={() => (modalOpen = false)}>Close</button>
      </footer>
    </div>
  </div>
{/if}
