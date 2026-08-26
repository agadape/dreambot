const fs = require('fs');
const file = '../../node_modules/@somnia-chain/markets-sdk/dist/graphqlBoundary.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'throw new IndexerError(operation, cause instanceof Error ? cause.message : String(cause), { cause });',
  'console.error("SDK FETCH CAUSE:", cause); throw new IndexerError(operation, cause instanceof Error ? cause.message : String(cause), { cause });'
);
fs.writeFileSync(file, content);
