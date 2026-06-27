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

  await page.getByRole('button', { name: 'New note', exact: true }).click()
  await page.getByRole('button', { name: 'Notes', exact: true }).click()

  await expect(page.getByRole('button', { name: 'Editor', exact: true })).toBeVisible()
  await expect(page.locator('.calendar-pane')).toBeVisible()
  await expect(page.locator('.editor-pane')).toHaveCount(0)

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
})

test('demo mode seeds notes and animates until interaction', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?demo=1')

  await expect(page.locator('.title-row input').first()).toHaveValue('Notit demo')
  await expect(page.locator('.app-shell')).toHaveClass(/theme-retro/)
  await expect(page.locator('.app-shell')).toHaveClass(/theme-notit-dark/, { timeout: 3500 })

  await page.getByRole('button', { name: 'Notes', exact: true }).click()
  const classAfterClick = await page.locator('.app-shell').getAttribute('class')
  await page.waitForTimeout(2600)
  await expect(page.locator('.app-shell')).toHaveClass(classAfterClick)
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
