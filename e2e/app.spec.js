import { expect, test } from '@playwright/test'

function uniqueUser() {
  return `e2e_${Date.now()}`
}

test('核心路径：注册、天气查询、AI 咨询', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /AI 旅行规划师/ })).toBeVisible()

  const username = uniqueUser()
  await page.getByRole('link', { name: /登录|注册/ }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole('button', { name: '注册' }).click()
  await page.getByLabel('用户名').fill(username)
  await page.getByLabel('密码').fill('e2e123456')
  await page.getByRole('button', { name: '创建账号' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText(username)).toBeVisible()

  await page.goto('/weather')
  await page.getByRole('combobox', { name: '城市名称' }).fill('北京')
  await page.getByRole('combobox', { name: '城市名称' }).press('Enter')
  await expect(page.getByRole('region', { name: /北京 天气概览/ })).toBeVisible()

  await page.goto('/chat')
  await expect(page.getByRole('heading', { name: '旅行顾问' })).toBeVisible()
  await page.getByRole('button', { name: '北京有哪些必去的景点？' }).click()
  await expect(page.getByText(/北京.*景点|热门景点推荐|故宫博物院/).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('参考来源')).toBeVisible()
})
