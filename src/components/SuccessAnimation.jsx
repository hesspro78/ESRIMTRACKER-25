import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SuccessAnimation = ({ 
  isVisible, 
  userName, 
  actionType, 
  onComplete,
  duration = 3000 
}) => {
  const [confettiPieces, setConfettiPieces] = useState([]);
  
  // Messages spécifiques pour l'entrée et la sortie
  const getSpecificMessage = () => {
    if (actionType === 'in') {
      return `🕘 Bienvenue ${userName} ! Pointage d'entrée enregistré 😄`;
    } else {
      return `👋 Merci ${userName} ! Pointage de sortie effectué avec succès ✅`;
    }
  };

  // Effet sonore (optionnel)
  const playSuccessSound = () => {
    try {
      // Création d'un son simple avec Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Ignore si Web Audio API n'est pas supporté
      console.log('Audio not supported');
    }
  };

  // Génération des confettis et gestion du timer
  useEffect(() => {
    if (isVisible) {
      // Jouer le son de succès
      playSuccessSound();

      const pieces = [];
      for (let i = 0; i < 80; i++) {
        pieces.push({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 1000,
          duration: 2000 + Math.random() * 1000, // Max 3 secondes total
          rotation: Math.random() * 360,
          color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#FF7675', '#74B9FF'][Math.floor(Math.random() * 10)],
          shape: ['circle', 'square', 'triangle', 'star', 'heart'][Math.floor(Math.random() * 5)],
          size: 6 + Math.random() * 16
        });
      }
      setConfettiPieces(pieces);

      // Auto-complete après la duration
      const timer = setTimeout(() => {
        console.log('SuccessAnimation: Timer completed, calling onComplete');
        if (onComplete) {
          onComplete();
        }
      }, duration);

      return () => {
        console.log('SuccessAnimation: Cleaning up timer');
        clearTimeout(timer);
      };
    } else {
      // Reset confetti when not visible
      setConfettiPieces([]);
    }
  }, [isVisible, duration, onComplete]);

  const ConfettiPiece = ({ piece }) => {
    const ShapeComponent = ({ className, size, color }) => {
      switch (piece.shape) {
        case 'circle':
          return <div className={`${className} rounded-full`} style={{ width: size, height: size, backgroundColor: color }} />;
        case 'square':
          return <div className={className} style={{ width: size, height: size, backgroundColor: color }} />;
        case 'triangle':
          return (
            <div 
              className={className}
              style={{ 
                width: 0, 
                height: 0, 
                borderLeft: `${size/2}px solid transparent`,
                borderRight: `${size/2}px solid transparent`,
                borderBottom: `${size}px solid ${color}`,
              }} 
            />
          );
        case 'star':
          return (
            <div className={className} style={{ color, fontSize: size }}>
              ⭐
            </div>
          );
        case 'heart':
          return (
            <div className={className} style={{ color, fontSize: size }}>
              ❤️
            </div>
          );
        default:
          return <div className={`${className} rounded-full`} style={{ width: size, height: size, backgroundColor: color }} />;
      }
    };

    return (
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: `${piece.x}%`, top: -20 }}
        initial={{ 
          y: -20, 
          opacity: 1, 
          rotate: 0,
          scale: 0
        }}
        animate={{ 
          y: window.innerHeight + 100, 
          opacity: [1, 1, 0.8, 0],
          rotate: piece.rotation * 4,
          scale: [0, 1, 1, 0.5],
          x: [0, Math.sin(piece.id) * 50, Math.cos(piece.id) * 30]
        }}
        transition={{ 
          duration: piece.duration / 1000,
          delay: piece.delay / 1000,
          ease: "easeOut"
        }}
      >
        <ShapeComponent 
          className="drop-shadow-lg"
          size={piece.size}
          color={piece.color}
        />
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="success-animation"
          className="fixed inset-0 z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overlay pour l'animation avec confettis */}
          <div className="fixed inset-0 overflow-hidden">
            {/* Effet de pulsation en arrière-plan */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-blue-500/10 to-purple-600/10"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Confettis */}
            {confettiPieces.map((piece) => (
              <ConfettiPiece key={piece.id} piece={piece} />
            ))}

            {/* Particules d'étoiles supplémentaires */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute pointer-events-none text-yellow-400 text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  rotate: 360
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 1,
                  ease: "easeOut"
                }}
              >
                ✨
              </motion.div>
            ))}
          </div>

          {/* Message de succès central */}
          <div className="fixed inset-0 flex items-center justify-center">
            <motion.div
              className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/50 max-w-md mx-4"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: -50 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.2
              }}
            >
              {/* Emoji animé */}
              <motion.div
                className="text-center mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 0.4
                }}
              >
                <div className="text-6xl mb-2">
                  {actionType === 'in' ? '😊' : '👋'}
                </div>
                <motion.div
                  className="text-4xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: 2,
                    delay: 0.6
                  }}
                >
                  🎉
                </motion.div>
              </motion.div>

              {/* Message principal */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {getSpecificMessage()}
                </h2>
              </motion.div>

              {/* Barre de progression pour le temps restant */}
              <motion.div
                className="w-full bg-gray-200 rounded-full h-2 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <motion.div
                  className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-2 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{
                    duration: (duration / 1000) - 0.5,
                    ease: "linear",
                    delay: 0.5
                  }}
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessAnimation;
