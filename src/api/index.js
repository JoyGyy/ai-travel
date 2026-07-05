/**
 * 统一 API 请求模块
 * 集中管理所有后端接口调用
 */
const BASE = '/api'

/** 用户登录 */
export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return res.json()
}

/** 用户注册 */
export async function register(username, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return res.json()
}

/** 查询天气 */
export async function fetchWeather(city) {
  const res = await fetch(`${BASE}/weather?city=${encodeURIComponent(city)}`)
  if (!res.ok) throw new Error('天气查询失败')
  return res.json()
}
