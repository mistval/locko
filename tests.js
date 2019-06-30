/* eslint-disable */

const assert = require('assert');
const locko = require('./index.js');

function wait(ms) {
  return new Promise((fulfill) => {
    setTimeout(fulfill, ms);
  });
}

async function addDelayed(arr) {
  await locko.lock('add');

  arr.push(1);
  await wait(100);
  arr.push(2);
  await wait(100);
  arr.push(3);

  await locko.unlock('add');
}

describe('Tests', function() {
  it('Should lock array pushes', async function() {
    const arr = [];
    await Promise.all([addDelayed(arr), addDelayed(arr), addDelayed(arr)]);
    assert(JSON.stringify(arr) === JSON.stringify([1,2,3,1,2,3,1,2,3]));
  });
});
