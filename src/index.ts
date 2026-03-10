#!/usr/bin/env node
import { YamahaReferenceServer } from './server.js';

const server = new YamahaReferenceServer();

process.on('SIGINT', () => {
  void server.stop().then(() => process.exit(0));
});

void server.run().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
