// Simple global refresh event utilities for admin pages/modals

export type AdminScope =
  | 'teachers'
  | 'students'
  | 'staff'
  | 'parents'
  | 'subjects'
  | 'classes'
  | 'id-cards'
  | 'notices'
  | 'complaints'
  | 'leave-requests'
  | 'fee-management'
  | '*';

const EVENT_NAME = 'admin-data-changed';

export function emitAdminDataChanged(scope: AdminScope = '*'): void {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent(EVENT_NAME, { detail: { scope } });
  window.dispatchEvent(event);
}

export function subscribeAdminDataChanged(
  handler: (scope: AdminScope) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => {
    const custom = e as CustomEvent<{ scope: AdminScope }>;
    handler(custom.detail?.scope || '*');
  };
  window.addEventListener(EVENT_NAME, listener as EventListener);
  return () =>
    window.removeEventListener(EVENT_NAME, listener as EventListener);
}
