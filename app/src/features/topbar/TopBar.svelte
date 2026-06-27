<script>
  export let token = ''
  export let user = null
  export let loading = false
  export let search = ''
  export let syncStatus = 'Synced'
  export let syncCountdown = ''
  export let showSyncCountdown = true
  export let leftCollapsed = false
  export let onToggleLeft = () => {}
  export let onConnect = () => {}
  export let onForceSync = () => {}
  export let onSearch = () => {}
  export let onToggleRepo = () => {}
  export let onToggleAi = () => {}
  export let onToggleSettings = () => {}
</script>

<header class:left-collapsed={leftCollapsed} class="topbar">
  {#if !leftCollapsed}
    <nav class="topbar-actions" aria-label="App sections">
      <button class="top-action" type="button" onclick={onConnect} disabled={loading || token}>
        {token ? `GitHub${user ? `: ${user.login}` : ''}` : 'GitHub'}
      </button>
      <button class="top-action" type="button" onclick={onToggleRepo} disabled={!token}>Repository</button>
      <button class="top-action" type="button" onclick={onToggleAi}>AI</button>
      <button class="top-action" type="button" onclick={onToggleSettings}>Setting</button>
    </nav>
    <div class="topbar-splitter"></div>
  {/if}

  <div class="topbar-main">
    <button class:active={leftCollapsed} class="focus-toggle top-action" type="button" title="Toggle note list" onclick={onToggleLeft}>
      {leftCollapsed ? 'Unfocus' : 'Focus'}
    </button>

    <div class="topbar-right">
      <label class="search">
        <span>Search</span>
        <input value={search} placeholder="title, body..." oninput={(event) => onSearch(event.currentTarget.value)} />
      </label>
      <div class="sync-group">
        <span class:unsynced={syncStatus === 'Unsync'} class="sync-pill">
          <span aria-hidden="true">{syncStatus === 'Unsync' ? '○' : '●'}</span>
          <span>{syncStatus}</span>
          {#if syncStatus === 'Unsync' && showSyncCountdown && syncCountdown}
            <small>{syncCountdown}</small>
          {/if}
        </span>
        <button class="top-action" type="button" onclick={onForceSync} disabled={loading || !token || syncStatus !== 'Unsync'}>Force Sync</button>
      </div>
    </div>
  </div>
</header>
