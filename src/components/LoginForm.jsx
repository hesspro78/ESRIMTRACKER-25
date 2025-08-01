import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth.jsx';
import { toast } from '@/components/ui/use-toast';
import { LogIn, Clock, Users, BarChart3, QrCode, ArrowLeft } from 'lucide-react';
import { useAppSettings } from '@/contexts/AppSettingsContext';

const LoginForm = ({ onSwitchToQR, onBackToClocking }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const { login, loading } = useAuth();
  const { appName, appLogo } = useAppSettings();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await login(formData);
    if (result.success) {
      toast({
        title: "Connexion réussie",
        description: `Bienvenue sur ${appName} !`
      });
    } else {
      toast({
        title: "Erreur de connexion",
        description: result.error || "Identifiants invalides.",
        variant: "destructive"
      });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Bouton retour vers l'interface de pointage */}
      {onBackToClocking && (
        <Button
          onClick={onBackToClocking}
          variant="ghost"
          className="absolute top-4 left-4 text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au Pointage
        </Button>
      )}

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block space-y-8 p-8 rounded-xl bg-white/10 backdrop-blur-md shadow-2xl"
        >
          <div className="text-center lg:text-left flex items-center space-x-4">
            <img-replace src={appLogo} alt={`${appName} Logo`} className="h-16 w-16 rounded-lg shadow-lg bg-white/20 p-1"/>
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">
                {appName}
              </h1>
              <p className="text-xl text-gray-200">
                Solution complète de gestion du temps et des présences
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg hover-lift"
            >
              <div className="p-3 gradient-purple rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Pointage en Temps Réel</h3>
                <p className="text-sm text-gray-300">Enregistrement automatique avec horodatage précis</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg hover-lift"
            >
              <div className="p-3 gradient-green rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Analyses Avancées</h3>
                <p className="text-sm text-gray-300">Statistiques détaillées et rapports personnalisés</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg hover-lift"
            >
              <div className="p-3 gradient-orange rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Gestion d'Équipe</h3>
                <p className="text-sm text-gray-300">Administration complète des employés et congés</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md mx-auto"
        >
          <Card className="bg-white/10 backdrop-blur-md shadow-2xl border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">
                Connexion
              </CardTitle>
              <CardDescription className="text-gray-300">
                Accédez à votre espace {appName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder-gray-400 focus:ring-purple-500"
                    placeholder="votre@email.com"
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200">Mot de passe</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder-gray-400 focus:ring-purple-500"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full gradient-purple hover:opacity-90 transition-opacity text-white"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Chargement...' : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <Button
                  variant="outline"
                  onClick={onSwitchToQR}
                  className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
                  disabled={loading}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Scanner un QR Code
                </Button>
              </div>

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginForm;
