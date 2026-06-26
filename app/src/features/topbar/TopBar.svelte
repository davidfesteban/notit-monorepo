<script>
  export let token = ''
  export let user = null
  export let loading = false
  export let search = ''
  export let onConnect = () => {}
  export let onSearch = () => {}
  export let onToggleRepo = () => {}
  export let onToggleAi = () => {}
</script>

<header class="topbar">
  <div class="wordmark">NOTIT</div>
  <button class="top-action" type="button" onclick={onConnect} disabled={loading || token}>
    {token ? `Connected${user ? `: ${user.login}` : ''}` : 'Connect GitHub'}
  </button>
  <button class="top-action" type="button" onclick={onToggleRepo} disabled={!token}>Repo</button>
  <button class="top-action" type="button" onclick={onToggleAi}>AI Settings</button>
  <label class="search">
    <span>Search</span>
    <input value={search} placeholder="title, body..." oninput={(event) => onSearch(event.currentTarget.value)} />
  </label>
</header>
