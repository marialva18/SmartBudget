const chunkReloadKey = 'qori:chunk-reload-attempted';

export function recoverChunkLoad<T>(loader: Promise<T>) {
  return loader
    .then((module) => {
      clearChunkReloadAttempt();
      return module;
    })
    .catch((error: unknown) => {
      if (shouldReloadForMissingChunk(error)) {
        markChunkReloadAttempt();
        window.location.reload();
        return new Promise<T>(() => undefined);
      }

      throw error;
    });
}

function shouldReloadForMissingChunk(error: unknown) {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.sessionStorage.getItem(chunkReloadKey) === '1') {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);

  return [
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'ChunkLoadError',
    'Loading chunk',
    'dynamically imported module',
  ].some((pattern) => message.includes(pattern));
}

function markChunkReloadAttempt() {
  window.sessionStorage.setItem(chunkReloadKey, '1');
}

function clearChunkReloadAttempt() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(chunkReloadKey);
  }
}
