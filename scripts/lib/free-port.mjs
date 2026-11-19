/**
 * 动态空闲端口分配（体验轮 3.1）。
 *
 * 背景：验收套件曾用固定端口 4173–4199，全部落在本机 TCP 动态端口范围
 * 1024–15000 内，会被 CEF/系统出站长连接随机占用 → EACCES / strictPort
 * 启动失败 → 偶发红（裁决轮 run1/2 的 4176 事故）。site-ui/progress-ui
 * 上一轮改成 44176/44177 只是避开范围，端口冲突可能性仍在（双套件同跑）。
 *
 * 方案：listen(0) 让内核发一个当前确实空闲的端口，close 后立刻交给
 * vite preview 绑定（TOCTOU 窗口毫秒级，实践中零冲突；若极端撞车
 * strictPort 会立刻报错而不是挂死，重跑即可）。
 * 支持 env 覆盖：envPort('A11Y_PORT') 有值则用固定值（调试用）。
 */
import net from 'node:net'

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port
      srv.close(() => resolve(port))
    })
  })
}

export async function pickPort(envName) {
  const v = envName ? process.env[envName] : ''
  if (v && Number(v) > 0) return Number(v)
  return freePort()
}
