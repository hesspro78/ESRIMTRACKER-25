import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { QrCode, CheckCircle, LogIn, LogOut, Clock, Settings } from 'lucide-react';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import QRScannerPage from './QRScannerPage';
import SuccessAnimation from './SuccessAnimation';
import NotificationToast from './NotificationToast';
import { useNotificationToast } from '@/hooks/useNotificationToast';

const ClockingInterface = ({ onAdminAccess }) => {
  const { appName, appLogo } = useAppSettings();
  const [view, setView] = useState('main'); // 'main' or 'scanner'
  const [confirmation, setConfirmation] = useState(null);
  const [adminKeySequence, setAdminKeySequence] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const { notification, showNotification, hideNotification } = useNotificationToast();

  // Gestion des raccourcis clavier pour l'accès admin
  useEffect(() => {
    const handleKeyPress = (e) => {
      const newSequence = adminKeySequence + e.key.toLowerCase();
      setAdminKeySequence(newSequence);
      
      // Vérifier si la séquence "admin" a été tapée
      if (newSequence.includes('admin')) {
        onAdminAccess();
        setAdminKeySequence('');
      } else if (newSequence.length > 10) {
        // Réinitialiser si trop long
        setAdminKeySequence('');
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [adminKeySequence, onAdminAccess]);

  // Auto-reset après timeout de séquence
  useEffect(() => {
    const timer = setTimeout(() => {
      setAdminKeySequence('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [adminKeySequence]);

  // Mise à jour de l'horloge en temps réel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScanSuccess = (userInfo, actionType) => {
    setView('main');

    // Show notification toast first
    const message = actionType === 'in' 
      ? '🎉 Pointage d\'entrée enregistré avec succès !' 
      : '✅ Pointage de sortie effectué avec succès !';
    
    showNotification({
      message,
      userName: userInfo.userName || 'Utilisateur',
      type: actionType === 'in' ? 'clock-in' : 'clock-out',
      duration: 3000
    });
    // D'abord afficher l'animation de succès
    setSuccessData({
      userName: userInfo.userName || 'Utilisateur',
      actionType
    });
    setShowSuccessAnimation(true);
  };

  const handleSuccessAnimationComplete = () => {
    console.log('ClockingInterface: Success animation completed');
    setShowSuccessAnimation(false);

    // Puis afficher la confirmation normale
    setConfirmation({
      userName: successData.userName,
      actionType: successData.actionType,
      time: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    });

    // Retour automatique après 3 secondes
    setTimeout(() => {
      console.log('ClockingInterface: Clearing confirmation');
      setConfirmation(null);
      setSuccessData(null);
    }, 3000);
  };

  if (view === 'scanner') {
    return (
      <QRScannerPage 
        onBackToMain={() => setView('main')}
        onScanSuccess={handleScanSuccess}
      />
    );
  }

  return (
    <>
      {/* Enhanced Notification Toast */}
      <NotificationToast
        isVisible={notification.isVisible}
        message={notification.message}
        userName={notification.userName}
        type={notification.type}
        duration={notification.duration}
        onComplete={hideNotification}
      />

      {/* Animation de succès */}
      <SuccessAnimation
        isVisible={showSuccessAnimation}
        userName={successData?.userName}
        actionType={successData?.actionType}
        onComplete={handleSuccessAnimationComplete}
        duration={3000}
      />

      {/* Bouton admin discret en bas à droite de l'écran */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onAdminAccess}
        className="fixed bottom-6 right-6 z-50 opacity-40 hover:opacity-100 transition-all duration-500 text-white/60 hover:text-white p-3 rounded-xl shadow-2xl backdrop-blur-xl border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
        title="Accès Administration (ou tapez 'admin')"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <Settings className="h-5 w-5 animate-pulse" />
      </Button>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Enhanced glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          {/* Animated gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-blue-500/20 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent" />
        </div>
        
        {/* Background animated elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" 
               style={{ filter: 'blur(60px)' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"
               style={{ filter: 'blur(80px)' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-500"
               style={{ filter: 'blur(70px)' }}></div>
          
          {/* Light trails */}
          <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent animate-pulse delay-300" />
          <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-transparent via-purple-400/20 to-transparent animate-pulse delay-700" />
        </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo et titre */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-4 mb-6 p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl"
               style={{
                 boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
               }}>
            <img
              src={appLogo}
              alt={`${appName} Logo`}
              className="h-16 w-16 rounded-xl shadow-2xl bg-white/10 backdrop-blur-sm p-2 border border-white/20"
            />
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {appName}
              </h1>
              <p className="text-white/80 text-lg drop-shadow-md">
                Système de Pointage
              </p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Interface principale */}
          {!confirmation && (
            <motion.div
              key="main"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mb-8"
              >
                <Button
                  onClick={() => {
                    console.log("🚀 Navigating to scanner...");
                    setView('scanner');
                  }}
                  className="relative w-full h-32 text-xl font-bold overflow-hidden border-0 shadow-2xl group backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-500"
                  size="lg"
                  style={{
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Animation de fond */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 via-blue-600/50 to-cyan-500/50 opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className={"absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"}></div>
                  
                  {/* Contenu du bouton */}
                  <div className="relative z-10 flex flex-col items-center space-y-3">
                    <motion.div
                      animate={{ 
                        rotateY: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <QrCode className="h-12 w-12 text-white drop-shadow-lg" />
                    </motion.div>
                    <span className="text-white drop-shadow-lg">
                      Pointer avec QR Code
                    </span>
                  </div>

                  {/* Effet de brillance */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    animate={{ x: [-100, 400] }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  />
                </Button>
              </motion.div>

              {/* Indicateur d'heure en temps réel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl"
                     style={{
                       boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                     }}>
                  <div className="flex items-center justify-center space-x-3 text-white">
                    <Clock className="h-6 w-6 text-cyan-400" />
                    <div>
                      <p className="text-lg font-semibold">
                        {currentTime.toLocaleTimeString('fr-FR')}
                      </p>
                      <p className="text-sm text-white/70">
                        {currentTime.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>


            </motion.div>
          )}



          {/* Message de confirmation */}
          {confirmation && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 border border-white/20 shadow-2xl"
                   style={{
                     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                   }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mb-6"
                >
                  <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-4" />
                  {confirmation.actionType === 'in' ? (
                    <LogIn className="h-12 w-12 mx-auto text-green-400" />
                  ) : (
                    <LogOut className="h-12 w-12 mx-auto text-red-400" />
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-2">
                    ✅ Bienvenue {confirmation.userName}
                  </h2>
                  <p className="text-lg text-gray-300 mb-2">
                    Pointage {confirmation.actionType === 'in' ? "d'entrée" : "de sortie"} enregistré
                  </p>
                  <p className="text-xl font-semibold text-cyan-400">
                    à {confirmation.time}
                  </p>
                </motion.div>

                {/* Barre de progression pour le retour automatique */}
                <motion.div
                  className="w-full bg-white/20 rounded-full h-2 mt-6 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div
                    className="bg-gradient-to-r from-green-400 to-cyan-400 h-2 rounded-full shadow-lg"
                    style={{
                      boxShadow: '0 0 10px rgba(52, 211, 153, 0.5)'
                    }}
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 3, ease: "linear" }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
};

export default ClockingInterface;
