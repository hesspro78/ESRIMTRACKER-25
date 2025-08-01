import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { QrCode, X, CheckCircle, LogIn, LogOut, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { playClockInSound, playClockOutSound } from '@/lib/audioUtils';

const QRScannerPage = ({ onBackToLogin, onBackToMain, onScanSuccess }) => {
  const [status, setStatus] = useState('scanning'); // scanning, verifying, success, error
  const [message, setMessage] = useState('Veuillez scanner votre QR Code');
  const [messageStyle, setMessageStyle] = useState('text-muted-foreground');
  const [actionType, setActionType] = useState(''); // 'in' or 'out'
  const [userInfo, setUserInfo] = useState(null);
  const scannerRef = useRef(null);

  const resetScanner = useCallback(() => {
    // Réinitialiser seulement l'état, le scanner sera recréé par l'useEffect
    setActionType('');
    setUserInfo(null);
    setStatus('scanning');
    setMessage('Veuillez scanner votre QR Code');
    setMessageStyle('text-muted-foreground');
  }, []);

  const handleScanVerification = useCallback(async (userId) => {
    setStatus('verifying');
    setMessage('Vérification en cours...');
    setMessageStyle('text-muted-foreground');

    try {
      const { data, error } = await supabase.functions.invoke('record-time-entry', {
        body: { userId },
      });

      if (error) {
        throw new Error(`Erreur de fonction Edge : ${error.message}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setActionType(data.action);
      setUserInfo(data.user || { userName: 'Utilisateur' });

      if (data.action === 'in') {
        setMessage("Pointage d'entrée enregistré avec succès");
        setMessageStyle('text-green-500 font-semibold');
        playClockInSound();
      } else {
        setMessage("Pointage de sortie enregistré avec succès");
        setMessageStyle('text-red-500 font-semibold');
        playClockOutSound();
      }

      setStatus('success');

      // Appeler onScanSuccess si fourni (pour la nouvelle interface)
      if (onScanSuccess) {
        setTimeout(() => {
          onScanSuccess(data.user || { userName: 'Utilisateur' }, data.action);
        }, 1500);
      } else {
        setTimeout(() => {
          resetScanner();
        }, 2000);
      }

    } catch (error) {
      console.error("Verification failed:", error);
      setStatus('error');
      setMessage(error.message || "Une erreur est survenue.");
      setMessageStyle('text-red-500 font-semibold');
      setTimeout(() => {
        resetScanner();
      }, 2000);
    }
  }, [resetScanner, onScanSuccess]);

  useEffect(() => {
    let html5Qrcode;
    let mounted = true;

    const checkBrowserSupport = () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { supported: false, error: "Ce navigateur ne supporte pas l'accès à la caméra." };
      }

      if (!window.location.protocol.includes('https') && window.location.hostname !== 'localhost') {
        return { supported: false, error: "L'acc��s à la caméra nécessite une connexion HTTPS." };
      }

      return { supported: true };
    };

    const checkCameraPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        // Fermer immédiatement le stream de test
        stream.getTracks().forEach(track => track.stop());
        return { success: true };
      } catch (err) {
        console.warn("Permissions check failed:", err);
        return { success: false, error: err };
      }
    };

    const startScanner = async () => {
      console.log("startScanner called", { status, scannerRef: !!scannerRef.current, mounted });

      if (status === 'scanning' && !scannerRef.current && mounted) {
        console.log("Waiting for DOM element...");

        // Attendre que l'élément DOM soit prêt avec retry
        let readerElement = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (!readerElement && attempts < maxAttempts && mounted) {
          await new Promise(resolve => setTimeout(resolve, 100));
          readerElement = document.getElementById('qr-reader');
          attempts++;
          console.log(`Attempt ${attempts}: Element found:`, !!readerElement);
        }

        if (!readerElement || !mounted) {
          console.error("QR reader element not found after retries", {
            element: !!readerElement,
            mounted,
            attempts,
            allElements: document.querySelectorAll('[id*="qr"]').length
          });
          setStatus('error');
          setMessage("Erreur d'initialisation du scanner.");
          setMessageStyle('text-red-500 font-semibold');
          return;
        }

        console.log("✅ QR reader element found:", readerElement);

        // Vérifier le support du navigateur
        const browserCheck = checkBrowserSupport();
        console.log("Browser check:", browserCheck);

        if (!browserCheck.supported && mounted) {
          setStatus('error');
          setMessage(browserCheck.error);
          setMessageStyle('text-red-500 font-semibold');
          return;
        }

        console.log("Skipping permission check, trying direct scanner init...");

        if (!mounted) return;

        try {
          console.log("Creating Html5Qrcode instance...");
          html5Qrcode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5Qrcode;

          console.log("Html5Qrcode instance created, starting camera...");

          const onScanSuccess = (decodedText) => {
            console.log("QR scanned:", decodedText);
            if (mounted && status === 'scanning' && scannerRef.current) {
              handleScanVerification(decodedText);
            }
          };

          // Configuration la plus simple possible
          const cameraConfig = { facingMode: "environment" };
          const scannerConfig = {
            fps: 10,
            qrbox: 250
          };

          console.log("Starting scanner with config:", { cameraConfig, scannerConfig });

          await html5Qrcode.start(
            cameraConfig,
            scannerConfig,
            onScanSuccess,
            (errorMessage) => {
              // Ignorer les erreurs de scan mineures
            }
          );

          console.log("✅ Scanner started successfully!");

        } catch (err) {
          console.error("Scanner initialization failed:", err);
          if (mounted) {
            setStatus('error');
            let errorMsg = "Impossible d'activer la caméra.";

            if (err.name === 'NotAllowedError') {
              errorMsg = "Accès à la caméra refusé. Autorisez l'accès et rechargez.";
            } else if (err.name === 'NotFoundError') {
              errorMsg = "Aucune caméra détectée sur cet appareil.";
            } else if (err.name === 'NotSupportedError') {
              errorMsg = "Caméra non supportée par ce navigateur.";
            }

            setMessage(errorMsg);
            setMessageStyle('text-red-500 font-semibold');
          }

          if (scannerRef.current) {
            try {
              await scannerRef.current.clear();
            } catch (clearErr) {
              // Ignorer
            }
            scannerRef.current = null;
          }
        }
      }
    };

    // Démarrer avec un délai pour s'assurer que le DOM est prêt
    const timeoutId = setTimeout(startScanner, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);

      const cleanup = async () => {
        if (scannerRef.current) {
          try {
            if (scannerRef.current.getState && scannerRef.current.getState() === 2) {
              await scannerRef.current.stop();
            }
          } catch (err) {
            // Ignorer les erreurs d'arrêt
          }

          try {
            await scannerRef.current.clear();
          } catch (err) {
            // Ignorer les erreurs de nettoyage
          }

          scannerRef.current = null;
        }
      };

      cleanup();
    };
  }, [status]);

  const handleBack = () => {
    if (onBackToMain) {
      onBackToMain();
    } else if (onBackToLogin) {
      onBackToLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white relative">
      <Button onClick={handleBack} variant="ghost" className="absolute top-4 left-4">
        <ArrowLeft className="mr-2" /> Retour
      </Button>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-black/30 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20"
      >
        <div className="text-center mb-6">
          <QrCode className="mx-auto h-12 w-12 text-primary mb-2" />
          <h1 className="text-3xl font-bold">Pointage Automatique</h1>
          <p className={`h-6 transition-colors duration-300 ${messageStyle}`}>{message}</p>
        </div>

        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black flex items-center justify-center mb-6">
          <AnimatePresence mode="wait">
            {status === 'scanning' && (
              <motion.div
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <div id="qr-reader" className="w-full h-full"></div>
                <div className="absolute inset-0 border-4 border-dashed border-primary/50 rounded-lg animate-pulse"></div>
              </motion.div>
            )}
            {status === 'verifying' && (
              <motion.div key="verifying" className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </motion.div>
            )}
            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="text-center"
              >
                <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
                {actionType === 'in' ? <LogIn className="h-12 w-12 mx-auto text-green-400" /> : <LogOut className="h-12 w-12 mx-auto text-red-400" />}
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="text-center"
              >
                <X className="h-24 w-24 text-red-500 mx-auto mb-4" />
                <Button
                  onClick={() => {
                    setStatus('scanning');
                    setMessage('Veuillez scanner votre QR Code');
                    setMessageStyle('text-muted-foreground');
                  }}
                  variant="outline"
                  className="mt-4 bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default QRScannerPage;
