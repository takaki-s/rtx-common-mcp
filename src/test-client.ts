import { YamahaDocClient } from './client.js';

async function test() {
  const client = new YamahaDocClient();
  
  console.log('--- Testing YamahaDocClient (Native Fetch) ---');
  try {
    const categories = await client.listCategoriesAndCommands();
    console.log(`Found ${categories.length} categories.`);
    
    const firstCategory = categories[0];
    if (firstCategory) {
      console.log('Sample Category:', firstCategory.name);
      console.log('Commands:', firstCategory.commands.length);
    }

    console.log('\n--- Fetching Detail: show ip route ---');
    const detail = await client.getCommandDetail('showstatus/show_ip_route.html');
    if (detail) {
      console.log('Name:', detail.name);
      console.log('Syntax:', detail.syntax);
      console.log('Description:', detail.description.substring(0, 150) + '...');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
