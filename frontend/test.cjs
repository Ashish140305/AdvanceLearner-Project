const { build } = require('vite');
const fs = require('fs');
async function test() {
  try {
    await build();
  } catch(e) {
    fs.writeFileSync('error.txt', e.message);
  }
}
test();
