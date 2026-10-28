import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));

export default {
  root: path.join(root, 'client'),
  publicDir: false,
  build: {
    outDir: path.join(root, 'public', 'build'),
    emptyOutDir: true
  }
};
