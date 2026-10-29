import { cpSync, copyFileSync, mkdirSync } from 'node:fs';
mkdirSync('dist/src/db', { recursive: true });
copyFileSync('src/db/schema.sql', 'dist/src/db/schema.sql');
cpSync('src/web/public', 'dist/src/web/public', { recursive: true });
