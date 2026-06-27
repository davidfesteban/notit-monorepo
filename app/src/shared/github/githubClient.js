const apiBase = 'https://api.github.com'
const oauthBase = import.meta.env.DEV ? '/github-oauth' : 'https://github.com'

export class GitHubClient {
  constructor(token) {
    this.token = token
    this.branchHeads = new Map()
  }

  async viewer() {
    return this.request('/user')
  }

  async getRepo(owner, repo) {
    return this.request(`/repos/${owner}/${repo}`)
  }

  async createRepo(name) {
    const repo = await this.request('/user/repos', {
      method: 'POST',
      body: { name, private: true, auto_init: true },
    })

    await this.ensureMasterBranch(repo.owner.login, repo.name, repo.default_branch)
    return this.getRepo(repo.owner.login, repo.name)
  }

  async ensureMasterBranch(owner, repo, defaultBranch = 'master') {
    if (defaultBranch === 'master') return

    const baseRef = await this.request(`/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`)

    try {
      await this.request(`/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        body: {
          ref: 'refs/heads/master',
          sha: baseRef.object.sha,
        },
      })
    } catch (error) {
      if (!String(error.message).includes('Reference already exists')) throw error
    }

    await this.request(`/repos/${owner}/${repo}`, {
      method: 'PATCH',
      body: { default_branch: 'master' },
    })
  }

  async ensureAgentsGuide(owner, repo) {
    try {
      await this.request(`/repos/${owner}/${repo}/contents/AGENTS.md?ref=master`)
      return
    } catch (error) {
      if (!String(error.message).includes('Not Found')) throw error
    }

    await this.commitFiles(owner, repo, {
      message: 'Add Notit agent guide',
      additions: [{ path: 'AGENTS.md', contentBase64: encodeBase64(defaultAgentsGuide()) }],
    })
  }

  async listNotes(owner, repo) {
    const tree = await this.request(`/repos/${owner}/${repo}/git/trees/master?recursive=1`)
    const files = (tree.tree || []).filter((item) => item.type === 'blob' && item.path.startsWith('notes/') && item.path.endsWith('.md'))

    return Promise.all(files.map((file) => this.getNote(owner, repo, file.path)))
  }

  async getNote(owner, repo, path) {
    const [content, commits] = await Promise.all([
      this.request(`/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=master`),
      this.request(`/repos/${owner}/${repo}/commits?sha=master&path=${encodeURIComponent(path)}&per_page=1`),
    ])

    return {
      path,
      markdown: decodeBase64(content.content || ''),
      fileSha: content.sha,
      commitSha: commits[0]?.sha || '',
      commitDate: commits[0]?.commit?.committer?.date || '',
    }
  }

  async commitFiles(owner, repo, { message, additions = [], deletions = [] }) {
    const maxAttempts = 5
    const branchKey = `${owner}/${repo}:master`

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const expectedHeadOid = this.branchHeads.get(branchKey) || (await this.currentBranchHead(owner, repo))
      try {
        const result = await this.graphql(
          `mutation CommitFiles($input: CreateCommitOnBranchInput!) {
            createCommitOnBranch(input: $input) {
              commit {
                oid
                committedDate
              }
            }
          }`,
          {
            input: {
              branch: {
                repositoryNameWithOwner: `${owner}/${repo}`,
                branchName: 'master',
              },
              message: { headline: message },
              expectedHeadOid,
              fileChanges: {
                additions: additions.map((file) => ({
                  path: file.path,
                  contents: file.contentBase64,
                })),
                deletions: deletions.map((path) => ({ path })),
              },
            },
          },
        )

        const commit = result.createCommitOnBranch.commit
        this.branchHeads.set(branchKey, commit.oid)
        return {
          commitSha: commit.oid,
          commitDate: commit.committedDate || new Date().toISOString(),
        }
      } catch (error) {
        if (isBranchHeadConflict(error) && attempt < maxAttempts - 1) {
          this.branchHeads.delete(branchKey)
          await sleep(350 * (attempt + 1))
          continue
        }
        throw error
      }
    }
  }

  async currentBranchHead(owner, repo) {
    const head = await this.request(`/repos/${owner}/${repo}/git/ref/heads/master?cachebust=${Date.now()}`)
    return head.object.sha
  }

  async listNoteHistory(owner, repo, path) {
    const commits = await this.request(`/repos/${owner}/${repo}/commits?sha=master&path=${encodeURIComponent(path)}&per_page=100`)
    return commits.map((commit) => ({
      path,
      commitSha: commit.sha,
      date: commit.commit?.committer?.date || '',
      message: commit.commit?.message || '',
    }))
  }

  async getNoteAtCommit(owner, repo, path, commitSha) {
    const content = await this.request(`/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(commitSha)}`)
    return {
      path,
      markdown: decodeBase64(content.content || ''),
      fileSha: content.sha,
      commitSha,
      commitDate: '',
    }
  }

  async request(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const text = await response.text()
    const data = text ? JSON.parse(text) : null

    if (!response.ok) {
      throw new Error(data?.message || `GitHub request failed: ${response.status}`)
    }

    return data
  }

  async graphql(query, variables = {}) {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    })

    const data = await response.json()
    if (!response.ok || data.errors?.length) {
      throw new Error(data.errors?.[0]?.message || `GitHub GraphQL failed: ${response.status}`)
    }
    return data.data
  }
}

export async function requestDeviceCode(clientId) {
  const response = await oauthFetch('/login/device/code', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ client_id: clientId }),
  })

  return readOAuthResponse(response)
}

export async function pollDeviceToken(clientId, deviceCode) {
  const response = await oauthFetch('/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  })

  return readOAuthResponse(response)
}

async function oauthFetch(path, options) {
  try {
    return await fetch(`${oauthBase}${path}`, options)
  } catch (error) {
    throw new Error(
      import.meta.env.DEV
        ? `GitHub login request failed through the local dev proxy: ${error.message}`
        : `GitHub login request failed. In a plain browser build, GitHub device-login endpoints may be blocked by CORS; run through the desktop shell or a trusted proxy.`,
    )
  }
}

async function readOAuthResponse(response) {
  const data = await response.json()
  if (!response.ok || data.error) {
    const message = data.error_description || data.error || `GitHub OAuth failed: ${response.status}`
    throw new OAuthError(message, data.error)
  }
  return data
}

export class OAuthError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'OAuthError'
    this.code = code
  }
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/')
}

function decodeBase64(value) {
  const binary = atob(String(value).replace(/\s/g, ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function defaultAgentsGuide() {
  return `# Notit Notes

This repository contains Notit notes.

## Rules for AI agents

- Notes live in \`notes/*.md\`.
- Treat each Markdown file as one note.
- Preserve frontmatter and Markdown formatting.
- Do not rewrite unrelated notes.
- Prefer small focused edits.
- Use Git history as the source of truth for previous versions.
- Mermaid blocks are diagrams.
- \`notit-table\` blocks are editable CSV-like tables.
- Keep commits focused and human-readable.
`
}

function isBranchHeadConflict(error) {
  return String(error?.message || '').includes('Expected branch to point to')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
