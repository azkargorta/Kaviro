import { useEffect, useState } from "react";

function readIsDark() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function useIsDarkMode() {
  const [isDark, setIsDark] = useState(readIsDark);

  useEffect(() => {
    setIsDark(readIsDark());

    const el = document.documentElement;
    const obs = new MutationObserver(() => {
      setIsDark(el.classList.contains("dark"));
    });
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });

    return () => obs.disconnect();
  }, []);

  return isDark;
}

