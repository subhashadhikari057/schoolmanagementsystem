export function generateSerial(modelName?: string) {
  // Simple frontend-only serial generator: MODELPREFIX-YYYYMMDD-HHMMSS-XXXX
  const prefix =
    (modelName || 'ASSET')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6) || 'ASSET';
  const now = new Date();
  const ts = now
    .toISOString()
    .replace(/[:.TZ-]/g, '')
    .slice(0, 14); // YYYYMMDDHHMMSS
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}
