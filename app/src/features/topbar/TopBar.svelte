<script>
  export let token = ''
  export let user = null
  export let loading = false
  export let syncStatus = 'Synced'
  export let syncCountdown = ''
  export let showSyncCountdown = true
  export let leftCollapsed = false
  export let isMobile = false
  export let mobileView = 'editor'
  export let onToggleLeft = () => {}
  export let onHeaderAction = () => {}
  export let onConnect = () => {}
  export let onForceSync = () => {}
  export let onToggleRepo = () => {}
  export let onToggleAi = () => {}
  export let onToggleSettings = () => {}

  let menuOpen = false
  let menuElement

  function runMenuAction(action) {
    menuOpen = false
    onHeaderAction()
    action()
  }

  function runHeaderAction(action) {
    onHeaderAction()
    action()
  }

  function closeMenuOnOutsidePointer(event) {
    if (!menuOpen || menuElement?.contains(event.target)) return
    menuOpen = false
  }
</script>

<svelte:window onpointerdown={closeMenuOnOutsidePointer} />

<header class:left-collapsed={leftCollapsed} class="topbar">
  {#if !leftCollapsed}
    <nav class="topbar-actions" aria-label="App sections">
      <button class="top-action" type="button" onclick={() => runHeaderAction(onConnect)} disabled={loading || token}>
        {token ? `GitHub${user ? `: ${user.login}` : ''}` : 'GitHub'}
      </button>
      <button class="top-action" type="button" onclick={() => runHeaderAction(onToggleRepo)} disabled={!token}>Repository</button>
      <button class="top-action" type="button" onclick={() => runHeaderAction(onToggleAi)}>AI</button>
      <button class="top-action" type="button" onclick={() => runHeaderAction(onToggleSettings)}>Setting</button>
    </nav>
    <div class="topbar-splitter"></div>
  {/if}

  <div class="topbar-main">
    <button class:active={leftCollapsed || isMobile} class="focus-toggle top-action" type="button" title="Toggle note list" onclick={() => runHeaderAction(onToggleLeft)}>
      {#if isMobile}
        {mobileView === 'list' ? 'Editor' : 'Notes'}
      {:else}
        {leftCollapsed ? 'Unfocus' : 'Focus'}
      {/if}
    </button>

    {#if isMobile}
      <details class="mobile-menu" bind:this={menuElement} bind:open={menuOpen}>
        <summary>Menu</summary>
        <div class="mobile-menu-items">
          <button type="button" onclick={() => runMenuAction(onConnect)} disabled={loading || token}>
            {token ? `GitHub${user ? `: ${user.login}` : ''}` : 'GitHub'}
          </button>
          <button type="button" onclick={() => runMenuAction(onToggleRepo)} disabled={!token}>Repository</button>
          <button type="button" onclick={() => runMenuAction(onToggleAi)}>AI</button>
          <button type="button" onclick={() => runMenuAction(onToggleSettings)}>Setting</button>
        </div>
      </details>
    {/if}

    <div class="topbar-right">
      <div class="sync-group">
        <span class:unsynced={syncStatus === 'Unsync'} class="sync-pill">
          <span aria-hidden="true">{syncStatus === 'Unsync' ? '○' : '●'}</span>
          <span>{syncStatus}</span>
          {#if syncStatus === 'Unsync' && showSyncCountdown && syncCountdown}
            <small>{syncCountdown}</small>
          {/if}
        </span>
        <button class="top-action" type="button" onclick={() => runHeaderAction(onForceSync)} disabled={loading || !token || syncStatus !== 'Unsync'}>Force Sync</button>
      </div>
    </div>
  </div>
</header>
