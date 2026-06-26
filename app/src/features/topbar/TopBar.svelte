<script>
  export let token = ''
  export let user = null
  export let loading = false
  export let search = ''
  export let syncStatus = 'Synced'
  export let onConnect = () => {}
  export let onForceSync = () => {}
  export let onSearch = () => {}
  export let onToggleRepo = () => {}
  export let onToggleAi = () => {}
  export let onToggleSettings = () => {}
</script>

<header class="topbar">
  <div class="wordmark">NOTIT</div>
  <button class="top-action" type="button" onclick={onConnect} disabled={loading || token}>
    {token ? `GitHub${user ? `: ${user.login}` : ''}` : 'GitHub'}
  </button>
  <button class="top-action" type="button" onclick={onToggleRepo} disabled={!token}>Repository</button>
  <button class="top-action" type="button" onclick={onToggleAi}>AI</button>
  <button class="top-action" type="button" onclick={onToggleSettings}>Setting</button>
  <label class="search">
    <span>Search</span>
    <input value={search} placeholder="title, body..." oninput={(event) => onSearch(event.currentTarget.value)} />
  </label>
  <div class="sync-group">
    <span class:unsynced={syncStatus === 'Unsync'} class="sync-pill">
      <span aria-hidden="true">{syncStatus === 'Unsync' ? '○' : '●'}</span>
      {syncStatus}
    </span>
    <button class="top-action" type="button" onclick={onForceSync} disabled={loading || !token || syncStatus !== 'Unsync'}>Force Sync</button>
  </div>
</header>
