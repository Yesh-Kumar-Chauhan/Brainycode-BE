// copyTemplates.ts
import { ncp } from 'ncp';
import { join } from 'path';

// Use Node.js __dirname to get the directory name of the current module
const srcDir = join(__dirname, '..', 'src', 'helpers', 'templates');
const destDir = join(__dirname, '..', 'dist', 'helpers', 'templates');

ncp(srcDir, destDir, (err) => {
  if (err) {
    return console.error(err);
  }
  console.log('Templates copied successfully.');
});
