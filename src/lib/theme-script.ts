export const THEME_STORAGE_KEY = "rve_finance_theme";

// Runs inline in <head> before first paint so a dark-mode user never sees a white flash.
// Saved choice wins; with none saved, follow the OS setting.
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})()`;
