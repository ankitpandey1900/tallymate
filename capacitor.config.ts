import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.alltracker.tallymate',
  appName: 'Tallymate',
  webDir: 'public',
  server: {
    url: 'https://tallymate.alltracker.online',
    cleartext: true
  }
};

export default config;
