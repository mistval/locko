const lockPromiseForKey = {};
const unlockFunctionForKey = {};

/**
 * Take out a lock. When this function returns (asynchronously),
 * you have the lock.
 * @param {string} key - The key to lock on. Anyone else who
 *   tries to lock on the same key will need to wait for it to
 *   be unlocked.
 */
async function lock(key) {
  if (!lockPromiseForKey[key]) {
    lockPromiseForKey[key] = Promise.resolve();
  }

  const takeLockPromise = lockPromiseForKey[key];
  lockPromiseForKey[key] = takeLockPromise.then(() => new Promise((fulfill) => {
    unlockFunctionForKey[key] = fulfill;
  }));

  return takeLockPromise;
}

/**
 * Release a lock.
 * @param {string} key - The key to release the lock for.
 *   The next person in line will now be able to take out
 *   the lock for that key.
 */
function unlock(key) {
  if (unlockFunctionForKey[key]) {
    unlockFunctionForKey[key]();
    delete unlockFunctionForKey[key];
  }
}

module.exports = {
  lock,
  unlock,
};
