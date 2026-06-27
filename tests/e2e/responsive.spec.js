const { test, expect } = require('@playwright/test')

test('auto-focuses early on narrow screens and keeps sync controls on the right', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 720 })
  await page.goto('/')

  const focus = page.getByRole('button', { name: 'Unfocus', exact: true })
  await expect(focus).toBeVisible()
  await expect(page.locator('.calendar-pane')).toHaveCount(0)
  await expect(page.locator('.tool-menu summary')).toBeVisible()

  const focusBox = await focus.boundingBox()
  const rightBox = await page.locator('.topbar-right').boundingBox()
  expect(focusBox.x).toBeLessThan(rightBox.x)
})

test('uses two-screen notes and editor flow on phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Notes', exact: true })).toBeVisible()
  await expect(page.locator('.editor-pane')).toBeVisible()
  await expect(page.locator('.calendar-pane')).toHaveCount(0)
  await expect(page.locator('.tool-menu summary')).toBeVisible()
  await expect(page.locator('.tools')).toBeHidden()
  await expect(page.locator('.topbar .search')).toHaveCount(0)

  await page.getByRole('button', { name: 'New note', exact: true }).click()
  await page.getByRole('button', { name: 'Notes', exact: true }).click()

  await expect(page.getByRole('button', { name: 'Editor', exact: true })).toBeVisible()
  await expect(page.locator('.calendar-pane')).toBeVisible()
  await expect(page.locator('.editor-pane')).toHaveCount(0)
  await expect(page.locator('.topbar-right')).toBeVisible()

  const searchButton = page.getByRole('button', { name: 'Search notes', exact: true })
  await expect(searchButton).toBeVisible()
  await searchButton.click()
  await expect(page.locator('.calendar-search input')).toBeVisible()

  await page.getByRole('button', { name: /Untitled note/ }).first().click()

  await expect(page.getByRole('button', { name: 'Notes', exact: true })).toBeVisible()
  await expect(page.locator('.editor-pane')).toBeVisible()
  await expect(page.locator('.calendar-pane')).toHaveCount(0)
})

test('exposes app settings from the phone menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await page.locator('.mobile-menu summary').click()
  await expect(page.getByRole('button', { name: 'GitHub', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Repository', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'AI', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Setting', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Setting', exact: true }).click()
  await expect(page.getByText('Theme')).toBeVisible()
  await expect(page.locator('.settings-panel .setting-row').nth(1)).toContainText('Theme')
  await expect(page.locator('.settings-panel')).toHaveCSS('overflow-x', 'auto')
})

test('closes open menus and panels when clicking elsewhere', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const mobileMenu = page.locator('.mobile-menu')
  await mobileMenu.locator('summary').click()
  await expect(mobileMenu).toHaveAttribute('open', '')
  await page.locator('.editor-pane').click({ position: { x: 20, y: 20 } })
  await expect(mobileMenu).not.toHaveAttribute('open', '')

  const toolMenu = page.locator('.tool-menu')
  await toolMenu.locator('summary').click()
  await expect(toolMenu).toHaveAttribute('open', '')
  await page.locator('.editor-pane').click({ position: { x: 20, y: 160 } })
  await expect(toolMenu).not.toHaveAttribute('open', '')

  await page.locator('.mobile-menu summary').click()
  await page.getByRole('button', { name: 'Setting', exact: true }).click()
  await expect(page.locator('.settings-panel')).toBeVisible()
  await page.locator('.editor-pane').click({ position: { x: 20, y: 20 } })
  await expect(page.locator('.settings-panel')).toHaveCount(0)
})

test('dismisses status messages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await page.getByRole('button', { name: 'New note', exact: true }).click()
  await expect(page.locator('.status-line')).toContainText('New local draft')
  await page.getByRole('button', { name: 'Dismiss message', exact: true }).click()
  await expect(page.locator('.status-line')).toHaveCount(0)
})

test('keeps local draft after reload before GitHub sync', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await page.getByRole('button', { name: 'New note', exact: true }).click()
  await page.locator('.title-row input').first().fill('Persistent local note')
  await page.locator('.title-row input').nth(1).fill('Survives app restart')
  await page.reload()

  await expect(page.locator('.title-row input').first()).toHaveValue('Persistent local note')
  await expect(page.locator('.title-row input').nth(1)).toHaveValue('Survives app restart')
})

test('demo mode only pauses from header controls and restarts from empty workspace', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?demo=1')

  await expect(page.locator('.title-row input').first()).toHaveValue('Notit demo')
  await expect(page.locator('.app-shell')).toHaveClass(/theme-retro/)
  await expect(page.locator('.app-shell')).toHaveClass(/theme-notit-dark/, { timeout: 3500 })

  await page.mouse.wheel(0, 400)
  await expect(page.locator('.app-shell')).toHaveClass(/theme-zed-slim/, { timeout: 2500 })

  await page.getByRole('button', { name: 'Notes', exact: true }).click()
  const classAfterClick = await page.locator('.app-shell').getAttribute('class')
  await expect(page.getByText('Demo paused. Click empty workspace to restart.')).toBeVisible()
  await page.waitForTimeout(1600)
  await expect(page.locator('.app-shell')).toHaveClass(classAfterClick)

  await page.locator('.calendar-list').click({ position: { x: 12, y: 12 } })
  await expect(page.locator('.app-shell')).toHaveClass(/theme-retro/, { timeout: 1500 })
  await expect(page.locator('.app-shell')).toHaveClass(/theme-notit-dark/, { timeout: 2500 })
})

test('focus toggle hides and restores the note list on desktop width', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 760 })
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Focus', exact: true })).toBeVisible()
  await expect(page.locator('.calendar-pane')).toBeVisible()

  await page.getByRole('button', { name: 'Focus', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Unfocus', exact: true })).toBeVisible()
  await expect(page.locator('.calendar-pane')).toHaveCount(0)

  await page.getByRole('button', { name: 'Unfocus', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Focus', exact: true })).toBeVisible()
  await expect(page.locator('.calendar-pane')).toBeVisible()
})

test('collapses markdown tools before the toolbar can overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 720 })
  await page.goto('/')

  await expect(page.locator('.tool-menu summary')).toBeVisible()
  await expect(page.locator('.tools')).toBeHidden()
})
