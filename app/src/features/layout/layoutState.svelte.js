export function createLayoutState() {
  let split = $state(36)
  let aiOpen = $state(false)
  let repoOpen = $state(false)
  let settingsOpen = $state(false)
  let leftCollapsed = $state(false)
  let isMobile = $state(false)
  let mobileView = $state('editor')
  let autoCollapsed = false

  const compactWidth = 900
  const expandedWidth = 1080
  const mobileWidth = 760

  function beginResize(event) {
    const startX = event.clientX
    const startSplit = split

    const move = (moveEvent) => {
      const delta = ((moveEvent.clientX - startX) / window.innerWidth) * 100
      split = Math.min(56, Math.max(24, startSplit + delta))
    }

    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function setLeftCollapsed(value, auto = false) {
    leftCollapsed = value
    autoCollapsed = auto
  }

  function syncViewport(width) {
    isMobile = width <= mobileWidth
    if (isMobile) {
      if (!leftCollapsed) setLeftCollapsed(true, true)
      return
    }

    if (width < compactWidth) {
      if (!leftCollapsed) setLeftCollapsed(true, true)
      return
    }

    if (autoCollapsed && width >= expandedWidth) setLeftCollapsed(false)
  }

  function toggleMobileView() {
    mobileView = mobileView === 'list' ? 'editor' : 'list'
  }

  function showMobileEditor() {
    if (isMobile) mobileView = 'editor'
  }

  function showMobileList() {
    if (isMobile) mobileView = 'list'
  }

  return {
    get split() { return split },
    get aiOpen() { return aiOpen },
    set aiOpen(value) { aiOpen = value },
    get repoOpen() { return repoOpen },
    set repoOpen(value) { repoOpen = value },
    get settingsOpen() { return settingsOpen },
    set settingsOpen(value) { settingsOpen = value },
    get leftCollapsed() { return leftCollapsed },
    set leftCollapsed(value) { setLeftCollapsed(value) },
    get isMobile() { return isMobile },
    get mobileView() { return mobileView },
    set mobileView(value) { mobileView = value === 'list' ? 'list' : 'editor' },
    setLeftCollapsed,
    toggleMobileView,
    showMobileEditor,
    showMobileList,
    syncViewport,
    beginResize,
  }
}
