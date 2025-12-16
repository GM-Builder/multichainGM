import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { FaMusic, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const DEFAULT_MUSIC = '/music/dashboard-ambient.mp3';

interface BackgroundMusicContextType {
    isPlaying: boolean;
    isMuted: boolean;
    togglePlay: () => void;
    toggleMute: () => void;
}

const BackgroundMusicContext = createContext<BackgroundMusicContextType | undefined>(undefined);

export const BackgroundMusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const router = useRouter();

    // Initialize Audio
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!audioRef.current) {
            const audio = new Audio(DEFAULT_MUSIC);
            audio.loop = true;
            audio.volume = 0.3;
            audioRef.current = audio;
        }

        // Load saved preferences
        const savedMusicEnabled = localStorage.getItem('musicEnabled');
        const savedMuted = localStorage.getItem('musicMuted');

        if (savedMuted === 'true') setIsMuted(true);

        // Auto-play if previously enabled or default to true (unless explicitly disabled)
        // Changing default to false to be less intrusive if no preference, 
        // or true if that was the previous behavior. 
        // The previous AudioPlayer defaulted to: localStorage.getItem('musicEnabled') !== 'false'
        const shouldPlay = savedMusicEnabled !== 'false';

        if (shouldPlay) {
            setIsPlaying(true);
            // Attempt play (browser might block)
            audioRef.current.play().catch(e => {
                console.log("Autoplay blocked:", e);
                setIsPlaying(false);
            });
        }

        return () => {
            // Cleanup on unmount (rare for _app provider)
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Handle Play/Pause
    useEffect(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.play().catch(e => {
                console.error("Play failed:", e);
                setIsPlaying(false);
            });
        } else {
            audioRef.current.pause();
        }
        localStorage.setItem('musicEnabled', isPlaying.toString());
    }, [isPlaying]);

    // Handle Mute
    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.muted = isMuted;
        localStorage.setItem('musicMuted', isMuted.toString());
    }, [isMuted]);


    // Sync volume persistence (optional, if we added volume slider later)

    const togglePlay = () => setIsPlaying(prev => !prev);
    const toggleMute = () => setIsMuted(prev => !prev);

    // Determine if we should show the floating button
    // User asked for "audio on/off in bottom right". 
    // We'll show it on all pages since this is a global provider.
    const showFloatingButton = true;

    return (
        <BackgroundMusicContext.Provider value={{ isPlaying, isMuted, togglePlay, toggleMute }}>
            {children}

            {showFloatingButton && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
                    {/* Music Toggle */}
                    <div className="bg-[#0B0E14]/80 backdrop-blur-md rounded-full shadow-lg border border-white/10 p-2 flex items-center gap-2 transition-all hover:bg-[#1A1D24]">
                        <button
                            onClick={togglePlay}
                            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${isPlaying
                                    ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                            aria-label={isPlaying ? 'Pause music' : 'Play music'}
                        >
                            {isPlaying ? (
                                <div className="flex space-x-0.5">
                                    <div className="w-0.5 h-4 bg-cyan-400 animate-music-bar1"></div>
                                    <div className="w-0.5 h-3 bg-cyan-400 animate-music-bar2"></div>
                                    <div className="w-0.5 h-2 bg-cyan-400 animate-music-bar3"></div>
                                </div>
                            ) : (
                                <FaMusic className="h-4 w-4" />
                            )}
                        </button>

                        {isPlaying && (
                            <button
                                onClick={toggleMute}
                                className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${isMuted
                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                                aria-label={isMuted ? 'Unmute' : 'Mute'}
                            >
                                {isMuted ? <FaVolumeMute className="h-4 w-4" /> : <FaVolumeUp className="h-4 w-4" />}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </BackgroundMusicContext.Provider>
    );
};

export const useBackgroundMusic = () => {
    const context = useContext(BackgroundMusicContext);
    if (context === undefined) {
        throw new Error('useBackgroundMusic must be used within a BackgroundMusicProvider');
    }
    return context;
};
