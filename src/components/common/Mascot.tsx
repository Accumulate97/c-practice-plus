/**
 * Mascot —— 站点原创吉祥物「C 灵」（任务07 §四·4.4）
 *
 * 几何角色：圆角方块身体（樱粉→薰衣草渐变）+ 发光触角 + 大眼睛，
 * 全部为本站原创自绘 SVG，不使用任何版权 IP 形象。
 * 颜色取深色系点缀色（两种主题下都成立：身体是固定渐变，眼睛用深紫）。
 *
 * mood 决定五官表情：
 * - idle   平常：圆眼 + 微笑
 * - happy  答对/成功：弯月眼 + 张嘴笑 + 腮红
 * - sad    答错/失败：圆眼 + 倒弧嘴 + 泪珠
 * - think  思考/待定：圆眼 + 小圆嘴 + 思考泡泡
 *
 * 默认 aria-hidden（纯装饰，语义由周边文案承载）；传 label 可切换为 role="img"。
 */
import { useId } from 'react'

export type MascotMood = 'idle' | 'happy' | 'sad' | 'think'

export default function Mascot({
  mood = 'idle',
  size = 64,
  label,
  className = '',
}: {
  mood?: MascotMood
  size?: number
  /** 传入则以 role="img"+aria-label 暴露给读屏；缺省为纯装饰 */
  label?: string
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const body = `cp-mascot-body-${uid}`
  const glow = `cp-mascot-glow-${uid}`

  const EYE = '#2a2450'
  const BLUSH = '#ff8fb1'

  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
    >
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc2d4" />
          <stop offset="0.55" stopColor="#ff9fbc" />
          <stop offset="1" stopColor="#b39ddb" />
        </linearGradient>
        <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#6ee7f9" stopOpacity="0.55" />
          <stop offset="1" stopColor="#6ee7f9" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 触角（cyan 发光点，缓慢呼吸） */}
      <path
        d="M48 18 C48 11 54 7 58 5"
        stroke="#b39ddb"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="58" cy="5" r="8" fill={`url(#${glow})`} />
      <circle
        cx="58"
        cy="5"
        r="3.4"
        fill="#6ee7f9"
        className="animate__animated animate__pulse animate__infinite animate__slow"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />

      {/* 身体：圆角方块（几何感） */}
      <rect x="16" y="18" width="64" height="64" rx="27" fill={`url(#${body})`} />
      {/* 顶部高光 */}
      <path d="M30 24 Q48 19 66 24" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* 眼睛（按 mood 切换形态） */}
      {mood === 'happy' ? (
        <>
          <path d="M31 46 q6 -7 12 0" stroke={EYE} strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M53 46 q6 -7 12 0" stroke={EYE} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="37" cy="46" rx="4.6" ry="6.2" fill={EYE} />
          <ellipse cx="59" cy="46" rx="4.6" ry="6.2" fill={EYE} />
          <circle cx="38.6" cy="43.6" r="1.7" fill="#ffffff" opacity="0.92" />
          <circle cx="60.6" cy="43.6" r="1.7" fill="#ffffff" opacity="0.92" />
        </>
      )}

      {/* 腮红（happy/idle 有） */}
      {(mood === 'happy' || mood === 'idle') && (
        <>
          <ellipse cx="27" cy="56" rx="4.4" ry="2.6" fill={BLUSH} opacity="0.5" />
          <ellipse cx="69" cy="56" rx="4.4" ry="2.6" fill={BLUSH} opacity="0.5" />
        </>
      )}

      {/* 嘴 */}
      {mood === 'idle' && (
        <path d="M42 60 q6 5.5 12 0" stroke={EYE} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      )}
      {mood === 'happy' && <path d="M41 58 h14 a7 7 0 0 1 -14 0 z" fill={EYE} />}
      {mood === 'sad' && (
        <>
          <path d="M42 64 q6 -5.5 12 0" stroke={EYE} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M67 50 q2.6 3.4 0 5.2 q-2.6 -1.8 0 -5.2" fill="#6ee7f9" />
        </>
      )}
      {mood === 'think' && (
        <>
          <ellipse cx="48" cy="61" rx="3" ry="3.6" fill={EYE} />
          <circle cx="72" cy="30" r="2.6" fill="#ece9f6" opacity="0.75" />
          <circle cx="78" cy="22" r="1.7" fill="#ece9f6" opacity="0.55" />
        </>
      )}
    </svg>
  )
}
