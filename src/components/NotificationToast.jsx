import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, User } from 'lucide-react';

const NotificationToast = ({ 
  isVisible, 
  message, 
  userName, 
  type = 'success', 
  duration = 3000,
  onComplete 
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isVisible) {
      setProgress(100);
      return;
    }

    // Start progress countdown
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = (remaining / duration) * 100;
      
      setProgress(progressPercent);
      
      if (remaining <= 0) {
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
    }, 16); // ~60fps updates

    return () => clearInterval(interval);
  }, [isVisible, duration, onComplete]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-400" />;
      case 'clock-in':
        return <Clock className="h-6 w-6 text-blue-400" />;
      case 'clock-out':
        return <Clock className="h-6 w-6 text-orange-400" />;
      default:
        return <User className="h-6 w-6 text-purple-400" />;
    }
  };

  const getEmoji = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'clock-in':
        return '🕘';
      case 'clock-out':
        return '👋';
      default:
        return '🎉';
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ 
            opacity: 0, 
            y: -100, 
            scale: 0.8,
            filter: 'blur(10px)'
          }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            filter: 'blur(0px)'
          }}
          exit={{ 
            opacity: 0, 
            y: -50, 
            scale: 0.9,
            filter: 'blur(5px)'
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            duration: 0.6
          }}
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] max-w-md w-full mx-4"
        >
          {/* Glassmorphism Container */}
          <div className="relative overflow-hidden rounded-2xl">
            {/* Background with glassmorphism effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 animate-pulse rounded-2xl" />
              
              {/* Light trails effect */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
              <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-transparent via-white/40 to-transparent animate-pulse" />
            </div>

            {/* Content */}
            <div className="relative p-6">
              <div className="flex items-start space-x-4">
                {/* Icon with glow effect */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex-shrink-0 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg"
                  style={{
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {getIcon()}
                </motion.div>

                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center space-x-2 mb-2"
                  >
                    <span className="text-2xl">{getEmoji()}</span>
                    <h3 className="text-lg font-semibold text-white drop-shadow-lg">
                      Bonjour {userName} !
                    </h3>
                  </motion.div>
                  
                  <motion.p
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90 text-sm leading-relaxed drop-shadow-md"
                  >
                    {message}
                  </motion.p>

                  {/* Current time display */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 text-xs text-white/70 font-mono"
                  >
                    {new Date().toLocaleTimeString('fr-FR')}
                  </motion.div>
                </div>
              </div>

              {/* Progress bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm"
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 rounded-full shadow-lg"
                  style={{
                    width: `${progress}%`,
                    boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
                  }}
                  transition={{ duration: 0.1, ease: "linear" }}
                />
              </motion.div>
            </div>

            {/* Floating particles effect */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 40}%`,
                }}
                animate={{
                  y: [-10, 10, -10],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationToast;