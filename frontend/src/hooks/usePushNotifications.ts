import { useCallback } from 'react';
import { apiClient } from '../lib/api';

const SW_PATH = '/sw.js';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from({ length: raw.length }, (_, i) => raw.charCodeAt(i));
}

interface SubscriptionKeys {
  p256dh: string;
  auth: string;
}

async function getOrCreateSubscription(vapidPublicKey: string): Promise<PushSubscription> {
  const reg = await navigator.serviceWorker.register(SW_PATH);
  await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

function subToPayload(sub: PushSubscription) {
  const json = sub.toJSON() as unknown as { endpoint: string; keys: SubscriptionKeys };
  return {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  };
}

export function usePushNotifications() {
  const subscribe = useCallback(async (): Promise<void> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Web Push not supported in this browser');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const { publicKey } = await apiClient.get<{ publicKey: string }>('/api/push/vapid-key');
    if (!publicKey) {
      console.warn('VAPID public key not configured on server');
      return;
    }

    const sub = await getOrCreateSubscription(publicKey);
    await apiClient.post('/api/push/subscribe', subToPayload(sub));
  }, []);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) return;

    const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (!reg) return;

    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    await apiClient.post('/api/push/unsubscribe', subToPayload(sub));
    await sub.unsubscribe();
  }, []);

  return { subscribe, unsubscribe };
}
