import React from 'react';
import { motion } from 'framer-motion';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useSuccessAnimation } from '@/components/SuccessAnimationContext';

interface SoundToggleButtonProps {
  className?: string;
  position?: 'navbar' | 'floating';
}

const SoundToggleButton: React.FC<SoundToggleButtonProps> = ({ 
  className = '',
  position = 'navbar'
}) => {
  const { soundEnabled, setSoundEnabled } = useSuccessAnimation();

  const handleToggle = () => {
    setSoundEnabled(!soundEnabled);
    
    // Play a test sound when enabling
    if (!soundEnabled) {
      try {
        const audio = new Audio('/sounds/success.mp3');
        audio.volume = 0.2;
        audio.play().catch(e => console.log('Test sound failed:', e));
      } catch (e) {
        console.log('Audio not available');
      }
    }
  };

  if (position === 'floating') {
    return (
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg border transition-all duration-300 ${
          soundEnabled
            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400 text-white'
            : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
        } ${className}`}
        aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
      >
        <motion.div
          animate={{
            scale: soundEnabled ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: soundEnabled ? Infinity : 0,
            repeatDelay: 2
          }}
        >
          {soundEnabled ? (
            <FaVolumeUp className="w-6 h-6" />
          ) : (
            <FaVolumeMute className="w-6 h-6" />
          )}
        </motion.div>
      </motion.button>
    );
  }

  // Navbar version (compact)
  return (
    <motion.button
      onClick={handleToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
        soundEnabled
          ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-700'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
      } ${className}`}
      aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
    >
      {soundEnabled ? (
        <FaVolumeUp className="w-4 h-4" />
      ) : (
        <FaVolumeMute className="w-4 h-4" />
      )}
      <span className="text-sm font-medium hidden sm:inline">
        {soundEnabled ? 'Sound On' : 'Sound Off'}
      </span>
    </motion.button>
  );
};

export default SoundToggleButton;