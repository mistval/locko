const lockPromiseForKey = {};
const unlockFunctionForKey = {};

function createNextLock(key) {
  return () => new Promise((fulfill) => {
    unlockFunctionForKey[key] = () => {
      if (--lockPromiseForKey[key][0] === 0) {
        delete lockPromiseForKey[key];
      }

      fulfill();
    };
  });
}

/**
 * Take out a lock. When this function returns (asynchronously),
 * you have the lock.
 * @param {string} key - The key to lock on. Anyone else who
 *   tries to lock on the same key will need to wait for it to
 *   be unlocked.
 */
function lock(key) {
  if (!lockPromiseForKey[key]) {
    lockPromiseForKey[key] = [0, Promise.resolve()];
  }

  const [count, takeLockPromise] = lockPromiseForKey[key];
  lockPromiseForKey[key] = [
    count + 1,
    takeLockPromise.then(createNextLock(key)),
  ];

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
