import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SETTINGS_KEY } from './config'

export type ThemeMode = 'light' | 'dark' | 'auto'

function applyTheme(mode: ThemeMode): void {
  const dark =
    mode === 'dark' ||
    (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      // 任务07 §四：深空紫夜色是站点身份，新用户默认深色；老用户 persist 里的偏好不受影响
      mode: 'dark',
      setMode: (mode) => {
        applyTheme(mode)
        set({ mode })
      },
    }),
    { name: SETTINGS_KEY, partialize: (s) => ({ mode: s.mode }) },
  ),
)

/** 应用启动时调用：接管 auto 跟随系统 */
export function watchSystemTheme(): void {
  applyTheme(useTheme.getState().mode)
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => applyTheme(useTheme.getState().mode))
}