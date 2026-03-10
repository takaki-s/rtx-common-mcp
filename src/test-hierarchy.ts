import { YamahaDocClient } from './client.js';

async function testHierarchy() {
  const client = new YamahaDocClient();
  
  console.log('--- 1. Root Chapters ---');
  const root = await client.listCategories();
  console.log(JSON.stringify(root.map(c => c.name).slice(-15), null, 2));

  console.log('\n--- 2. Switch Control (Chapter 48) ---');
  const swctl = await client.listCategories('スイッチ制御');
  console.log(JSON.stringify(swctl, null, 2));

  console.log('\n--- 3. L2MS API (Chapter 48.3) ---');
  const api = await client.listCategories('スイッチの制御 ( L2MS API )');
  console.log(JSON.stringify(api, null, 2));
}

testHierarchy().catch(console.error);
