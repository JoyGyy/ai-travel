import '@testing-library/jest-dom/vitest'

// Node 25 的实验性 Web Storage 可能注入不完整的 global localStorage，
// 测试中使用轻量内存实现，保证浏览器状态相关测试跨 Node 版本稳定。
const storage = new Map<string, string>()
const memoryStorage: Storage = {
  clear: () => storage.clear(),
  getItem: key => storage.get(key) ?? null,
  key: index => [...storage.keys()][index] ?? null,
  get length() { return storage.size },
  removeItem: key => storage.delete(key),
  setItem: (key, value) => storage.set(key, String(value)),
}
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: memoryStorage })
Object.defineProperty(window, 'localStorage', { configurable: true, value: memoryStorage })
