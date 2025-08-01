import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const defaultColors = {
  background: { h: 220, s: 20, l: 4 },
  foreground: { h: 210, s: 40, l: 98 },
  primary: { h: 262, s: 83, l: 58 },
  secondary: { h: 220, s: 14, l: 14 },
  accent: { h: 220, s: 14, l: 14 }, 
  card: { h: 220, s: 20, l: 6 },
  muted: { h: 220, s: 14, l: 14 },
  border: { h: 220, s: 13, l: 18 },
  input: { h: 220, s: 13, l: 18 },
  ring: { h: 262, s: 83, l: 58 },
  destructive: { h: 0, s: 62, l: 30 },
};

const hslToCssVar = (hsl) => `${hsl.h} ${hsl.s}% ${hsl.l}%`;

export const ThemeProvider = ({ children }) => {
  const [themeColors, setThemeColors] = useState(() => {
    const storedColors = localStorage.getItem('themeColors');
    return storedColors ? JSON.parse(storedColors) : defaultColors;
  });

  const applyTheme = useCallback((colors) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([name, hsl]) => {
      root.style.setProperty(`--${name}`, hslToCssVar(hsl));
      if (name === 'primary' || name === 'secondary' || name === 'accent' || name === 'destructive' || name === 'card' || name === 'muted' || name === 'popover') {
         root.style.setProperty(`--${name}-foreground`, hslToCssVar(colors.foreground));
      }
    });
  }, []);
  
  useEffect(() => {
    applyTheme(themeColors);
    localStorage.setItem('themeColors', JSON.stringify(themeColors));
  }, [themeColors, applyTheme]);

  const updateThemeColor = (colorName, newHslValue) => {
    setThemeColors(prevColors => ({
      ...prevColors,
      [colorName]: newHslValue
    }));
  };
  
  const resetToDefaultTheme = () => {
    setThemeColors(defaultColors);
  };

  const applyCurrentTheme = useCallback(() => {
    applyTheme(themeColors);
  }, [themeColors, applyTheme]);


  const value = {
    themeColors,
    updateThemeColor,
    resetToDefaultTheme,
    applyCurrentTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};