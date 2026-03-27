import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'AI Form Autofill',
  version: '2.0.0',
  description: 'Offline-first semantic form autofill with optional AI enhancements.',
  permissions: ['activeTab', 'storage', 'scripting'],
  host_permissions: ['<all_urls>'],
  background: { service_worker: 'src/background/index.ts', type: 'module' },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      all_frames: true,
      match_about_blank: true,
      run_at: 'document_idle'
    }
  ],
  action: {
    default_popup: 'src/ui/popup/popup.html',
    default_icon: { '16': 'icons/icon16.svg', '48': 'icons/icon48.svg', '128': 'icons/icon128.svg' }
  },
  options_page: 'src/ui/options/options.html',
  icons: { '16': 'icons/icon16.svg', '48': 'icons/icon48.svg', '128': 'icons/icon128.svg' }
});
