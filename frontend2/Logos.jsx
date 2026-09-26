/**
 * Reusable logos for GSCS (Ghana Students' Chemical Society)
 * and KNUST (Kwame Nkrumah University of Science and Technology).
 *
 * Usage examples:
 *   import { GscsLogo, KnustLogo, KnustEmblem, LOGOS } from './Logos'
 *
 *   // Component usage:
 *   <GscsLogo className="h-10 w-10" />
 *   <KnustLogo badge className="h-8 w-auto" />
 *   <KnustEmblem className="h-9 w-9" />
 *
 *   // Raw asset URLs:
 *   <img src={LOGOS.knust} alt="KNUST" />
 */

export const LOGOS = {
  gscs: '/gscs-logo.png',
  gscsCircle: '/gscs-logo-circle.png',
  knust: '/knust-logo.png',
  knustTransparent: '/knust-logo-transparent.png',
  knustEmblem: '/knust-emblem.png',
  knustEmblemTransparent: '/knust-emblem-transparent.png',
}

/**
 * GSCS Chemical Society Crest
 * @param {'circle' | 'full'} [variant='circle']
 * @param {boolean} [badge=true] Wrap in clean white circular container with ring
 */
export function GscsLogo({
  variant = 'circle',
  className = 'h-9 w-9',
  badge = true,
  alt = "Ghana Students' Chemical Society",
  ...props
}) {
  const src = variant === 'circle' ? LOGOS.gscsCircle : LOGOS.gscs
  const badgeClasses = badge
    ? 'rounded-full bg-surface object-contain p-0.5 shadow-sm ring-1 ring-white/30'
    : 'object-contain'

  return (
    <img
      src={src}
      alt={alt}
      className={`${badgeClasses} ${className}`}
      {...props}
    />
  )
}

/**
 * KNUST Horizontal Logo (crest + typography)
 * @param {'full' | 'transparent'} [variant='full']
 * @param {boolean} [badge=false] Wrap in white pill for dark backgrounds
 */
export function KnustLogo({
  variant = 'full',
  badge = false,
  className = 'h-8 w-auto',
  alt = 'Kwame Nkrumah University of Science and Technology',
  ...props
}) {
  const src = variant === 'transparent' ? LOGOS.knustTransparent : LOGOS.knust

  if (badge) {
    return (
      <div className="inline-flex items-center rounded-lg bg-surface px-2.5 py-1 shadow-sm ring-1 ring-white/20 backdrop-blur-sm">
        <img
          src={src}
          alt={alt}
          className={`object-contain ${className}`}
          {...props}
        />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain ${className}`}
      {...props}
    />
  )
}

/**
 * KNUST Crest Emblem (crest alone without the text block)
 * @param {boolean} [transparent=false]
 * @param {boolean} [badge=false]
 */
export function KnustEmblem({
  transparent = false,
  badge = false,
  className = 'h-9 w-9',
  alt = 'KNUST Emblem',
  ...props
}) {
  const src = transparent ? LOGOS.knustEmblemTransparent : LOGOS.knustEmblem
  const badgeClasses = badge
    ? 'rounded-full bg-surface object-contain p-1 shadow-sm ring-1 ring-white/30'
    : 'object-contain'

  return (
    <img
      src={src}
      alt={alt}
      className={`${badgeClasses} ${className}`}
      {...props}
    />
  )
}

export default {
  GscsLogo,
  KnustLogo,
  KnustEmblem,
  LOGOS,
}
