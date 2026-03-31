/**
 * LIFF helpers – all functions are safe to call even before liff.init() resolves.
 * Import the liff instance from LiffProvider context instead of calling liff directly.
 */

export const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID!

/**
 * Check whether the current browser is running inside the LINE app.
 * Returns false during SSR or when LIFF is not yet initialised.
 */
export function isInLineClient(): boolean {
  if (typeof window === 'undefined') return false
  return window.navigator.userAgent.includes('Line/')
}

/**
 * Build a shareable invite URL for a group.
 */
export function buildInviteUrl(inviteCode: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
  return `${base}/join/${inviteCode}`
}

/**
 * Build the LINE share text for a group invite.
 */
export function buildShareText(groupName: string, inviteCode: string): string {
  return `加入「${groupName}」分帳群組！\n點擊連結加入：${buildInviteUrl(inviteCode)}`
}
