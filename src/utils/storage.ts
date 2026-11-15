// localStorage 薄封装，替代原先未声明依赖的 `store` 包
const storage = {
  get(key: string): string | null {
    return localStorage.getItem(key)
  },
  set(key: string, value: string): void {
    localStorage.setItem(key, value)
  },
  remove(key: string): void {
    localStorage.removeItem(key)
  },
}

export default storage
