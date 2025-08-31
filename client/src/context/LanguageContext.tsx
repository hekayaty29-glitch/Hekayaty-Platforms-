import React, { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "ar";

interface LanguageContextValue {
  lang: Lang;
  toggle: () => void;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    return saved === "ar" ? "ar" : "en";
  });

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const toggle = () => setLang((prev) => (prev === "en" ? "ar" : "en"));

  return (
    <LanguageContext.Provider value={{ lang, toggle, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback to English if provider is not mounted yet (during hydration errors)
    return { lang: "en" as Lang, toggle: () => {}, setLang: () => {} } as LanguageContextValue;
  }
  return ctx;
};
