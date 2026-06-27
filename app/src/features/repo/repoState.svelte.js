import { tick } from 'svelte'
import { GitHubClient, pollDeviceToken, requestDeviceCode } from '../../shared/github/githubClient.js'
import { clearSession, loadSession, saveRepo, saveToken } from '../../shared/storage/sessionStorage.js'

export function createRepoState() {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || ''
  const session = loadSession()
  const initialRepo = session.repo || { owner: '', name: '' }

  let token = $state(session.token)
  let repo = $state(initialRepo)
  let user = $state(null)
  let device = $state(null)
  let repoOwner = $state(initialRepo.owner || '')
  let repoName = $state(initialRepo.name || '')
  let loading = $state(false)
  let status = $state('')
  let error = $state('')

  const client = $derived(token ? new GitHubClient(token) : null)

  async function connect() {
    clearMessage()

    if (!clientId) {
      error = 'Set VITE_GITHUB_CLIENT_ID to enable GitHub Device Login.'
      return
    }

    loading = true
    try {
      device = await requestDeviceCode(clientId)
      status = 'Enter the code on GitHub, then leave this window open.'
      pollForToken(device)
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }

  async function pollForToken(activeDevice) {
    let interval = activeDevice.interval || 5

    while (device?.device_code === activeDevice.device_code && !token) {
      await sleep(interval * 1000)

      try {
        const result = await pollDeviceToken(clientId, activeDevice.device_code)
        token = result.access_token
        saveToken(token)
        device = null
        status = 'GitHub connected.'
        await tick()
        await loadViewer()
        return
      } catch (err) {
        if (err.code === 'authorization_pending') {
          status = 'Waiting for GitHub authorization...'
          continue
        }
        if (err.code === 'slow_down') {
          interval += 5
          status = 'GitHub asked us to slow down. Still waiting...'
          continue
        }
        error = err.message
        return
      }
    }
  }

  async function loadViewer() {
    if (!client) return
    try {
      user = await client.viewer()
      if (!repoOwner) repoOwner = user.login
    } catch (err) {
      error = err.message
    }
  }

  async function useRepo(createIfMissing = false) {
    if (!client) return null

    const owner = repoOwner.trim()
    const name = repoName.trim()
    if (!owner || !name) {
      error = 'Enter a GitHub owner and repo name.'
      return null
    }

    loading = true
    clearMessage()

    try {
      let selectedRepo
      try {
        selectedRepo = await client.getRepo(owner, name)
      } catch (err) {
        if (!createIfMissing) throw err
        selectedRepo = await client.createRepo(name)
      }

      await client.ensureMasterBranch(selectedRepo.owner.login, selectedRepo.name, selectedRepo.default_branch)
      await client.ensureAgentsGuide(selectedRepo.owner.login, selectedRepo.name)
      repo = { owner: selectedRepo.owner.login, name: selectedRepo.name }
      repoOwner = repo.owner
      repoName = repo.name
      saveRepo(repo)
      return repo
    } catch (err) {
      error = err.message
      return null
    } finally {
      loading = false
    }
  }

  function disconnect() {
    clearSession()
    token = ''
    repo = { owner: '', name: '' }
    repoOwner = ''
    repoName = ''
    user = null
    device = null
    status = 'Disconnected.'
  }

  function clearMessage() {
    error = ''
    status = ''
  }

  function setStatus(value) {
    status = value
  }

  return {
    get token() { return token },
    get repo() { return repo },
    get user() { return user },
    get device() { return device },
    get client() { return client },
    get repoOwner() { return repoOwner },
    set repoOwner(value) { repoOwner = value },
    get repoName() { return repoName },
    set repoName(value) { repoName = value },
    get loading() { return loading },
    get status() { return status },
    get error() { return error },
    connect,
    loadViewer,
    useRepo,
    disconnect,
    setStatus,
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
