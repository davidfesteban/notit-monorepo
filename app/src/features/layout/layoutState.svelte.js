export function createLayoutState() {
  let split = $state(36)
  let aiOpen = $state(false)
  let repoOpen = $state(false)

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

  return {
    get split() { return split },
    get aiOpen() { return aiOpen },
    set aiOpen(value) { aiOpen = value },
    get repoOpen() { return repoOpen },
    set repoOpen(value) { repoOpen = value },
    beginResize,
  }
}
