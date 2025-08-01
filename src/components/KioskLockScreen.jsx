import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';

const KioskLockScreen = ({ onUnlock }) => {
  const { kioskPassword, kioskPasswordFailMessage, loadingSettings } = useAppSettings();
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLockedOut) {
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsLockedOut(false);
            setAttempts(0);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLockedOut]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLockedOut || loadingSettings) return;

    if (password === kioskPassword) {
      onUnlock();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(kioskPasswordFailMessage || 'Mot de passe incorrect.');
      setPassword('');

      if (newAttempts >= 3) {
        setIsLockedOut(true);
        setError(`Trop de tentatives. Veuillez patienter.`);
      }
    }
  };

  if (loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-sm bg-black/30 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl font-bold">Accès Sécurisé</CardTitle>
            <CardDescription>Veuillez entrer le mot de passe du kiosque pour continuer.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kiosk-password-input">Mot de passe</Label>
                <Input
                  id="kiosk-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLockedOut}
                  className="bg-white/20 border-white/30 text-white placeholder-gray-400 text-center text-lg tracking-widest"
                />
              </div>
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-400 text-center min-h-[20px]"
                  >
                    {isLockedOut ? `${error} (${countdown}s)` : error}
                  </motion.p>
                )}
              </AnimatePresence>
              <Button type="submit" className="w-full gradient-purple" disabled={isLockedOut}>
                {isLockedOut ? `Verrouillé` : 'Déverrouiller'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default KioskLockScreen;