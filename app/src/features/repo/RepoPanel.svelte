<script>
  export let repoOwner = ''
  export let repoName = ''
  export let loading = false
  export let onRepoOwner = () => {}
  export let onRepoName = () => {}
  export let onUseExisting = () => {}
  export let onCreateIfMissing = () => {}
  export let onDisconnect = () => {}
</script>

<section class="repo-panel">
  <label>
    Owner
    <input value={repoOwner} placeholder="github-user" oninput={(event) => onRepoOwner(event.currentTarget.value)} />
  </label>
  <label>
    Repo
    <input value={repoName} placeholder="notit-notes" oninput={(event) => onRepoName(event.currentTarget.value)} />
  </label>
  <button type="button" onclick={onUseExisting} disabled={loading}>Use existing</button>
  <button type="button" onclick={onCreateIfMissing} disabled={loading}>Create private repo</button>
  <button type="button" onclick={onDisconnect}>Disconnect</button>
</section>
