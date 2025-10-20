// src/components/Footer.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaTwitter, 
  FaTelegram,
  FaDiscord, 
  FaEnvelope,
} from 'react-icons/fa';
import { CONTRACT_ADDRESS } from '@/utils/constants';

interface FooterProps {
  scrollToLeaderboard?: () => void;
  scrollToMintSection?: () => void;
  activeMenu?: string;
}

const LOGO_PATH = "/logo.png"

const Footer: React.FC<FooterProps> = ({ 
  scrollToLeaderboard, 
  scrollToMintSection,
  activeMenu = "dashboard" 
}) => {
  const router = useRouter();

  return (
    <footer className="relative bg-gradient-to-b from-cyan-900/90 to-black overflow-hidden py-8 md:py-16">
      {/* Background elements - Hidden on mobile */}
      <div className="hidden md:block absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat opacity-5 pointer-events-none"></div>
      
      {/* Glowing elements - Hidden on mobile */}
      <div className="hidden md:block absolute top-20 right-20 w-64 h-64 rounded-full bg-cyan-500/20 blur-xl animate-pulse pointer-events-none"></div>
      <div className="hidden md:block absolute bottom-40 left-20 w-80 h-80 rounded-full bg-cyan-600/10 blur-xl animate-pulse pointer-events-none"></div>
      
      {/* Footer top border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Desktop Layout - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-white/90 mb-16">
          <div className="space-y-6">
            <p className="text-gray-300 text-sm leading-relaxed">
              <span className='text-cyan-400 font-semibold'>GannetX</span> is an on-chain ecosystem navigator that transforms daily blockchain interactions, ensuring secure and seamless multi-chain user experiences.
            </p>
          </div>
        </div>
        
        {/* Mobile/Tablet Minimalist Layout */}
        <div className="md:hidden space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src={LOGO_PATH}
              alt="GannetX Logo"
              className="h-12 w-auto object-contain" 
            />
          </div>

          {/* Social Icons - Compact */}
          <div className="flex justify-center space-x-4">
            <a 
              href="https://x.com/gannetx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-400 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-cyan-700/30"
            >
              <FaTwitter className="text-lg" />
            </a>
            <a 
              href="https://t.me/gannetx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-400 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-cyan-700/30"
            >
              <FaTelegram className="text-lg" />
            </a>
            <div className="bg-cyan-900/40 text-cyan-400 w-10 h-10 rounded-full flex items-center justify-center border border-cyan-700/30 opacity-50">
              <FaDiscord className="text-lg" />
            </div>
            <div className="bg-cyan-900/40 text-cyan-400 w-10 h-10 rounded-full flex items-center justify-center border border-cyan-700/30 opacity-50">
              <FaEnvelope className="text-lg" />
            </div>
          </div>

          {/* Copyright - Compact */}
          <div className="text-center">
            <p className="text-gray-400 text-xs">© 2025 GannetX</p>
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-cyan-900/30 border border-cyan-700/20 text-cyan-400 text-xs">
              Multi-Chain Navigator
            </div>
          </div>

          {/* Legal Links - Compact */}
          <div className="flex justify-center gap-4 text-xs text-gray-400">
            <span className="hover:text-cyan-300 transition-colors cursor-pointer">Terms</span>
            <span>•</span>
            <span className="hover:text-cyan-300 transition-colors cursor-pointer">Privacy</span>
            <span>•</span>
            <span className="hover:text-cyan-300 transition-colors cursor-pointer">Support</span>
          </div>
        </div>

        {/* Desktop Footer Bottom - Hidden on mobile */}
        <div className="hidden md:block mt-16 relative">
          {/* Separator with animation */}
          <div className="flex-1 relative h-px w-full mb-8">
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-70"></div>
            <div 
              className="absolute top-0 h-px w-20 animate-gradient-x" 
              style={{
                boxShadow: '0 0 8px 1px rgba(0, 229, 255, 0.6)',
                background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.8), transparent)'
              }}
            />
          </div>
          
          {/* Desktop content grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-4">
            {/* Left - Logo */}
            <div className="flex items-center space-x-2">
              <img 
                src={LOGO_PATH}
                alt="GannetX Logo"
                className="h-18 w-36 object-contain" 
              />
            </div>
            
            {/* Middle - Copyright */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="text-gray-400 text-sm">© 2025 GannetX. All rights reserved.</div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-px bg-cyan-400 animate-pulse-width"></div>
              </div>
              <div className="mt-2 px-2 py-0.5 rounded-full bg-cyan-900/30 border border-cyan-700/20 text-cyan-400 text-xs font-medium">
                GannetX
              </div>
            </div>
            
            {/* Right - Social & Links */}
            <div className="flex flex-col items-end gap-4"> 
              <div className="flex space-x-4">
                <a 
                  href="https://x.com/gannetx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-400 hover:text-cyan-300 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border border-cyan-700/30"
                >
                  <FaTwitter className="transform group-hover:-translate-y-1 transition-transform duration-300" />
                </a>
                <a 
                  href="https://t.me/gannetx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-400 hover:text-cyan-300 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border border-cyan-700/30"
                >
                  <FaTelegram className="transform group-hover:-translate-y-1 transition-transform duration-300" />
                </a>
                <div className="group bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-400 hover:text-cyan-300 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border border-cyan-700/30 cursor-pointer">
                  <FaDiscord className="transform group-hover:-translate-y-1 transition-transform duration-300" />
                </div>
                <div className="group bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-400 hover:text-cyan-300 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border border-cyan-700/30 cursor-pointer">
                  <FaEnvelope className="transform group-hover:-translate-y-1 transition-transform duration-300" />
                </div>
              </div>

              <div className="flex gap-6 text-sm">
                <div className="text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer relative group">
                  Terms
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300"></span>
                </div>
                <div className="text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer relative group">
                  Privacy
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300"></span>
                </div>
                <div className="text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer relative group">
                  Support
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;