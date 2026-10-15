import { api } from './client'
import { ENDPOINTS } from './endpoints'

const decodeKey = (value) => {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const binary = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export async function currentPushSubscription() {
  if (!pushSupported()) return null
  return (await navigator.serviceWorker.ready).pushManager.getSubscription()
}

export async function enablePush() {
  if (!pushSupported()) throw new Error('Push notifications are not supported in this browser.')
  if (Notification.permission === 'denied') throw new Error('Notifications are blocked in your browser settings.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')
  const { public_key: publicKey, configured } = await api.get(ENDPOINTS.pushPublicKey)
  if (!configured || !publicKey) throw new Error('Device notifications are not configured yet.')
  const registration = await navigator.serviceWorker.register('/sw.js')
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) })
  const json = subscription.toJSON()
  await api.post(ENDPOINTS.pushSubscriptions, { endpoint: subscription.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth })
  return subscription
}

export async function disablePush() {
  const subscription = await currentPushSubscription()
  if (!subscription) return
  await api.post(ENDPOINTS.pushUnsubscribe, { endpoint: subscription.endpoint })
  await subscription.unsubscribe()
}
