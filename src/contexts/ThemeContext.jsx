import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { useApp } from './AppContext';
import { themes, applyTheme } from '../themes/themes';

const ThemeContext = createContext(null);
export const useThemeContext = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const { data, updateSettings } = useApp();
  const themeId = data.settings.theme || 'ocean';
  const darkMode = !!data.settings.darkMode;
  const compactMode = !!data.settings.compactMode;

  useEffect(() => {
    applyTheme(themeId, darkMode);
  }, [themeId, darkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('compact', compactMode);
  }, [compactMode]);

  const setTheme = useCallback((id) => updateSettings({ theme: id }), [updateSettings]);
  const toggleDark = useCallback(() => updateSettings({ darkMode: !darkMode }), [updateSettings, darkMode]);

  const value = useMemo(
    () => ({ themeId, theme: themes[themeId] || themes.ocean, themes, darkMode, setTheme, toggleDark }),
    [themeId, darkMode, setTheme, toggleDark]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
