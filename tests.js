/* eslint-disable */

const assert = require('assert');
const locko = require('./index.js');

function wait(ms) {
  return new Promise((fulfill) => {
    setTimeout(fulfill, ms);
  });
}

function triRandom() {
  return Math.random() * Math.random() * Math.random();
}

async function addDelayed(arr, key = 'add') {
  await locko.lock(key);

  await wait(10);
  arr.push(1);
  await wait(100);
  arr.push(2);
  await wait(100);
  arr.push(3);

  await locko.unlock(key);
}

describe('Tests', function() {
  it('Should lock array pushes', async function() {
    const arr = [];
    await Promise.all([addDelayed(arr), addDelayed(arr), addDelayed(arr)]);
    assert(JSON.stringify(arr) === JSON.stringify([1,2,3,1,2,3,1,2,3]));
  });

  it('Should allow concurrency between locks with different keys', async function() {
    const arr = [];
    await Promise.all([addDelayed(arr, 'key1'), addDelayed(arr, 'key2'), addDelayed(arr, 'key1')]);
    assert(JSON.stringify(arr) === JSON.stringify([1,1,2,2,3,3,1,2,3]));
  });

  it('Does the right thing with very high concurrency', async function() {
    let inLockFunction = false;
    const arr = [];
    const promises = Array(1000).fill(0).map(async (_, i) => {
      await wait(Math.floor(Math.random() * 3));
      return locko.doWithLock('add', async () => {
        assert(!inLockFunction);
        inLockFunction = true;
        await wait(Math.floor(Math.random() * 3));
        arr.push(i);
        inLockFunction = false;
      });
    });

    await Promise.all(promises);

    assert(arr.length === 1000);
    assert(arr.sort((a, b) => a - b).every((el, i) => el === i));
  }).timeout(100000);

  it('Survives a chaos test', async function() {
    const testers = Array(1000).fill(0).map((_, i) => ({
      startMs: Math.floor(Math.random() * 2500),
      internalDelayMs: Math.floor(triRandom() * 100),
      i,
    }));

    let inLockFunction = false;
    const arr = [];

    await Promise.all(
      testers.map(async (tester) => {
        await wait(tester.startMs);
        await locko.doWithLock('add', async () => {
          assert(!inLockFunction);
          inLockFunction = true;
          await wait(tester.internalDelayMs);
          arr.push(tester.i);
          inLockFunction = false;
        });
      }),
    );

    assert(arr.length === 1000);
    assert(arr.sort((a, b) => a - b).every((el, i) => el === i));
  }).timeout(100000);
});
