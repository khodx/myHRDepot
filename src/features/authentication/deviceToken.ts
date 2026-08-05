const MHD_DEVICE_TOKEN_STORAGE_KEY = 'mhd.auth.deviceToken';

function mhdCreateDeviceToken(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `mhd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function mhdGetOrCreateDeviceToken(): string {
  try {
    const storedToken = globalThis.localStorage?.getItem(MHD_DEVICE_TOKEN_STORAGE_KEY);
    if (storedToken) return storedToken;

    const nextToken = mhdCreateDeviceToken();
    globalThis.localStorage?.setItem(MHD_DEVICE_TOKEN_STORAGE_KEY, nextToken);
    return nextToken;
  } catch {
    return mhdCreateDeviceToken();
  }
}

export function mhdGetDeviceLabel(): string {
  const userAgent = globalThis.navigator?.userAgent;
  if (!userAgent) return 'Unknown device';

  const browser = userAgent.includes('Edg/')
    ? 'Edge'
    : userAgent.includes('Firefox/')
      ? 'Firefox'
      : userAgent.includes('Chrome/') || userAgent.includes('CriOS/')
        ? 'Chrome'
        : userAgent.includes('Safari/')
          ? 'Safari'
          : null;

  const platform =
    userAgent.includes('iPhone')
      ? 'iPhone'
      : userAgent.includes('Android')
        ? 'Android'
        : userAgent.includes('Windows')
          ? 'Windows'
          : userAgent.includes('Mac OS X') || userAgent.includes('Macintosh')
            ? 'macOS'
            : userAgent.includes('Linux')
              ? 'Linux'
              : null;

  if (browser && platform) return `${browser} on ${platform}`;
  if (browser) return browser;
  if (platform) return platform;

  return 'Unknown device';
}
