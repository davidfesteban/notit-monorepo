const { test, expect } = require('@playwright/test')

test('auto-focuses early on narrow screens and keeps sync controls on the right', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 720 })
  await page.goto('/')

  const focus = page.getByRole('button', { name: 'Unfocus', exact: true })
  await expect(focus).toBeVisible()
  await expect(page.locator('.calendar-pane')).toHaveCount(0)
  await expect(page.locator('.tool-menu summary')).toBeVisible()

  const focusBox = await focus.boundingBox()
  const rightBox = await page.locator('.topbar-right').boundingBox()
  expect(focusBox.x).toBeLessThan(rightBox.x)
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
