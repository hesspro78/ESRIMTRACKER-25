import React, { useState, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { Palette, Save, RotateCcw, Eye } from 'lucide-react';

const hexToHsl = (hex) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0; 
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToHex = ({ h, s, l }) => {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[0, 8, 4].map(n => Math.round(f(n) * 255).toString(16).padStart(2, '0')).join('')}`;
};

const ColorControl = ({ label, colorName, colorValue, onColorChange, onHexChange }) => {
  const [displayPicker, setDisplayPicker] = useState(false);
  const [hexInput, setHexInput] = useState(hslToHex(colorValue));

  useEffect(() => {
    setHexInput(hslToHex(colorValue));
  }, [colorValue]);

  const handlePickerChange = (newHex) => {
    setHexInput(newHex);
    onColorChange(colorName, hexToHsl(newHex));
  };

  const handleInputChange = (e) => {
    const newHex = e.target.value;
    setHexInput(newHex);
    if (/^#([0-9A-F]{3}){1,2}$/i.test(newHex)) {
      onHexChange(colorName, hexToHsl(newHex));
    }
  };
  
  const popover = {
    position: 'absolute',
    zIndex: '2',
    top: 'calc(100% + 8px)',
    left: 0,
  };
  const cover = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`${colorName}-color`} className="text-muted-foreground">{label}</Label>
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setDisplayPicker(!displayPicker)}
            className="w-24 h-10 border-muted-foreground/30"
          >
            <div className="w-full h-full rounded-sm" style={{ backgroundColor: hslToHex(colorValue) }} />
          </Button>
          {displayPicker ? (
            <div style={popover}>
              <div style={cover} onClick={() => setDisplayPicker(false)} />
              <HexColorPicker color={hslToHex(colorValue)} onChange={handlePickerChange} />
            </div>
          ) : null}
        </div>
        <Input
          id={`${colorName}-color-hex`}
          value={hexInput}
          onChange={handleInputChange}
          className="w-32 bg-background/70 border-muted-foreground/30 text-foreground placeholder-muted-foreground/50"
        />
      </div>
    </div>
  );
};

const AdminUICustomizationTab = () => {
  const { themeColors, updateThemeColor, resetToDefaultTheme, applyCurrentTheme } = useTheme();
  const [currentColors, setCurrentColors] = useState(themeColors);
  
  useEffect(() => {
    setCurrentColors(themeColors);
  }, [themeColors]);

  const handleColorChange = useCallback((colorName, newHslValue) => {
    setCurrentColors(prev => ({ ...prev, [colorName]: newHslValue }));
  }, []);

  const handleSaveTheme = () => {
    Object.entries(currentColors).forEach(([name, hsl]) => {
      updateThemeColor(name, hsl);
    });
    toast({ title: "Succès", description: "Thème sauvegardé et appliqué." });
  };

  const handleResetTheme = () => {
    resetToDefaultTheme();
    setCurrentColors(themeColors); 
    toast({ title: "Réinitialisation", description: "Thème par défaut restauré." });
  };
  
  const handlePreviewTheme = () => {
    applyCurrentTheme(); 
    const root = document.documentElement;
    Object.entries(currentColors).forEach(([name, hsl]) => {
      const cssVar = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
      root.style.setProperty(`--${name}`, cssVar);
      if (name === 'primary' || name === 'secondary' || name === 'accent' || name === 'destructive' || name === 'card' || name === 'muted' || name === 'popover') {
         root.style.setProperty(`--${name}-foreground`, `${currentColors.foreground.h} ${currentColors.foreground.s}% ${currentColors.foreground.l}%`);
      }
    });
     toast({ title: "Aperçu", description: "Aperçu du thème appliqué. Sauvegardez pour conserver." });
  };


  const colorFields = [
    { name: 'primary', label: 'Couleur Primaire' },
    { name: 'secondary', label: 'Couleur Secondaire' },
    { name: 'accent', label: 'Couleur d\'Accentuation' },
    { name: 'background', label: 'Couleur de Fond' },
    { name: 'foreground', label: 'Couleur du Texte Principal' },
    { name: 'card', label: 'Couleur des Cartes' },
    { name: 'border', label: 'Couleur des Bordures' },
    { name: 'destructive', label: 'Couleur Destructive (Erreurs)' },
  ];

  return (
    <TabsContent value="uiCustomization" className="space-y-6">
      <Card className="glass-effect border-gradient">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Palette className="mr-2 h-5 w-5 text-purple-400" />
            Personnalisation de l'Interface Utilisateur
          </CardTitle>
          <CardDescription>Modifiez les couleurs principales de l'application. Les changements sont prévisualisés en temps réel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {colorFields.map(field => (
              currentColors[field.name] && (
                <ColorControl
                  key={field.name}
                  label={field.label}
                  colorName={field.name}
                  colorValue={currentColors[field.name]}
                  onColorChange={handleColorChange}
                  onHexChange={handleColorChange}
                />
              )
            ))}
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t border-muted-foreground/20">
            <Button onClick={handleSaveTheme} className="gradient-green w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder le Thème
            </Button>
            <Button onClick={handlePreviewTheme} variant="outline" className="w-full sm:w-auto">
              <Eye className="mr-2 h-4 w-4" />
              Prévisualiser
            </Button>
            <Button onClick={handleResetTheme} variant="destructive" className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" />
              Réinitialiser par Défaut
            </Button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default AdminUICustomizationTab;