import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.alltracker.tallymate',
  appName: 'Tallymate',
  webDir: 'public',
  server: {
    url: 'http://10.82.69.109:3000',
    cleartext: true
  }
};

export default config;
