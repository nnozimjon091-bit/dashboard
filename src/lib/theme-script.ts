// Server komponentidan ham o'qiladigan tema konstantalari (bu fayl "use client" emas).

export const THEME_KEY = "marketing-dashboard:theme:v1";

/**
 * Sahifa chizilishidan oldin ishga tushadi — shunda qorong'i rejimda
 * birinchi kadrda oq ekran "chaqnab" ketmaydi.
 */
export const THEME_BOOTSTRAP = `(function(){try{var c=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});var m=(!c||c==='system')?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):c;document.documentElement.setAttribute('data-theme',m);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;
