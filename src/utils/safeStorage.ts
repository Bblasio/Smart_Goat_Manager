/**
 * Safe LocalStorage Utility for Smart Goat Farm Management
 * Prevents QuotaExceededError crashes when storing large profiles, base64 images, or logs.
 */

export const sanitizeProfileForLocalCache = (profile: any): any => {
  if (!profile || typeof profile !== 'object') return profile;
  const clone = { ...profile };
  // If logo_url is a massive base64 image or long data URL (> 1500 chars), strip it from local cache.
  // The full logo remains in Firebase RTDB / Cloud storage.
  if (
    clone.logo_url &&
    typeof clone.logo_url === 'string' &&
    (clone.logo_url.startsWith('data:') || clone.logo_url.length > 1500)
  ) {
    clone.logo_url = '';
  }
  return clone;
};

/**
 * Sanitizes records payload before caching locally to prevent 5MB storage quota exhaustion.
 * Strips huge inline base64 images from photos.
 */
export const sanitizeRecordsForLocalCache = (payload: any): any => {
  if (!payload || typeof payload !== 'object') return payload;
  const clean = { ...payload };

  if (Array.isArray(clean.goats)) {
    clean.goats = clean.goats.map((g: any) => {
      if (g && typeof g.photo_url === 'string' && (g.photo_url.startsWith('data:') || g.photo_url.length > 1500)) {
        return { ...g, photo_url: undefined };
      }
      return g;
    });
  }

  return clean;
};

/**
 * Automatically purges redundant and non-essential caches when storage quota is reached.
 */
export const cleanStorageQuota = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // 1. Remove redundant email-specific duplicate profile keys (sgm_profile_email_*)
      if (key.startsWith('sgm_profile_email_')) {
        keysToRemove.push(key);
      }
      // 2. Remove outdated pending task day markers
      else if (key.startsWith('sgm_pending_tasks_done_') && !key.includes(todayStr)) {
        keysToRemove.push(key);
      }
      // 3. Remove non-essential notification dismissal cache
      else if (key === 'sgm_dismissed_notifs' || key === 'smartgoat_dismissed_alerts') {
        keysToRemove.push(key);
      }
      // 4. Remove temporary or backup keys
      else if (key.includes('_backup_') || key.startsWith('sgm_temp_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });

    // 5. Shrink sgm_user or sgm_profile_* if they contain bloated base64 data URLs
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key === 'sgm_user' || key.startsWith('sgm_profile_')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw && raw.length > 5000) {
            const parsed = JSON.parse(raw);
            const sanitized = sanitizeProfileForLocalCache(parsed);
            localStorage.setItem(key, JSON.stringify(sanitized));
          }
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    console.warn('cleanStorageQuota warning:', err);
  }
};

// Preemptively run on startup to guarantee healthy quota state
cleanStorageQuota();

/**
 * Safe setItem that catches QuotaExceededError and prevents app-crashing exceptions.
 */
export const safeSetItem = (key: string, value: string): boolean => {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    try {
      cleanStorageQuota();
      // Retry once after cleanup
      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.warn(`LocalStorage write for "${key}" skipped (quota protected):`, retryErr);
      return false;
    }
  }
};

export const safeGetItem = (key: string): string | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`safeGetItem error for key "${key}":`, err);
    return null;
  }
};

export const safeRemoveItem = (key: string): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`safeRemoveItem error for key "${key}":`, err);
  }
};

/**
 * Complete purge of all farm-related local storage caches for emergency error boundary recovery.
 */
export const clearAllFarmCaches = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sgm_') || key.startsWith('smart_goat') || key.startsWith('smartgoat'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  } catch (err) {
    console.warn('clearAllFarmCaches error:', err);
  }
};
