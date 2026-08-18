import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartumroh.guide',
  appName: 'SmartUmroh Muthowif',
  webDir: 'dist',
  server: {
    cleartext: true
  },
  plugins: {
    KeepAwake: {
      // Configuration for KeepAwake if needed
    }
  }
};

export default config;
