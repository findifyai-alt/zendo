import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let projectId = process.env.FIREBASE_PROJECT_ID;
try {
  const configPath = path.resolve(__dirname, '../../firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const rawConfig = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(rawConfig);
    projectId = config.projectId || projectId;
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json:', e);
}

if (!getApps().length) {
  initializeApp({
    projectId: projectId || 'gen-lang-client-0111988136',
  });
}

export const adminAuth = getAuth();

