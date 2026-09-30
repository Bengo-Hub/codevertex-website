'use client';

import { useEffect } from 'react';

// Loads the Vera chat widget AFTER React has hydrated.
//
// The widget injects its own <div id="vera-root"> into <body>. When the script was a plain
// <script async> in the root layout, it could run before hydration finished, and React then
// reported "Hydration failed because the server rendered HTML didn't match the client".
//
// The script is created dynamically, so document.currentScript is still set while it runs
// and the widget can read its data-* attributes exactly as before.
const SCRIPT_ID = 'vera-widget-script';

export function VeraWidget() {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return; // already loaded (StrictMode / navigation)

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = 'https://marketflow.codevertexafrica.com/widget/chat.js';
    script.dataset.tenant = 'codevertex';
    script.dataset.mode = 'platform';
    script.dataset.businessType = 'codevertex';
    script.dataset.apiUrl = 'https://marketflowai.codevertexafrica.com';
    script.dataset.primaryColor = '#9100B0';
    script.dataset.accentColor = '#b800e0';
    script.dataset.widgetTitle = 'Vera';
    script.dataset.whatsapp = '254743793901';
    script.dataset.phone = '+254743793901';
    document.body.appendChild(script);
  }, []);

  return null;
}
