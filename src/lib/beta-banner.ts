// Plain module (not 'use client') so the server-rendered layout can inline the script.
export const BETA_BANNER_STORAGE_KEY = 'xa-beta-banner-dismissed';

// Runs in <head> before first paint. The banner is prerendered into the static
// export, so without this a returning visitor who dismissed it would see it flash
// until hydration.
export const BETA_BANNER_HEAD_SCRIPT = `try{if(localStorage.getItem('${BETA_BANNER_STORAGE_KEY}')==='1')document.documentElement.setAttribute('data-beta-dismissed','')}catch(e){}`;
