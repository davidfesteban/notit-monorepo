const tokenKey = 'notit.githubToken'
const repoKey = 'notit.repo'
const commitMetaKey = 'notit.commitMeta'
const settingsKey = 'notit.settings'

export function loadSession() {
  return {
    token: localStorage.getItem(tokenKey) || '',
    repo: readJson(repoKey, null),
    commitMeta: readJson(commitMetaKey, {}),
    settings: readJson(settingsKey, { autosaveEnabled: true }),
  }
}

export function saveToken(token) {
  localStorage.setItem(tokenKey, token)
}

export function saveRepo(repo) {
  localStorage.setItem(repoKey, JSON.stringify(repo))
}

export function saveCommitMeta(meta) {
  localStorage.setItem(commitMetaKey, JSON.stringify(meta))
}

export function saveSettings(settings) {
  localStorage.setItem(settingsKey, JSON.stringify(settings))
}

export function clearSession() {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(repoKey)
  localStorage.removeItem(commitMetaKey)
  localStorage.removeItem(settingsKey)
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}
