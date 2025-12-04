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
    <footer className="relative bg-[#050608] border-t border-white/5 overflow-hidden py-8 md:py-16 z-20">
      {/* Background elements - Hidden on mobile */}
      <div className="hidden md:block absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat opacity-5 pointer-events-none"></div>

      {/* Glowing elements - Hidden on mobile */}
      <div className="hidden md:block absolute top-20 right-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-xl animate-pulse pointer-events-none"></div>
      <div className="hidden md:block absolute bottom-40 left-20 w-80 h-80 rounded-full bg-cyan-600/5 blur-xl animate-pulse pointer-events-none"></div>

      {/* Footer top border */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>

      <div className="container mx-auto px-4 relative z-10">
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
              className="bg-white/5 hover:bg-white/10 text-cyan-400 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-white/5"
            >
              <FaTwitter className="text-lg" />
            </a>
            <a
              href="https://t.me/gannetx"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 text-cyan-400 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-white/5"
            >
              <FaTelegram className="text-lg" />
            </a>
            <div className="bg-white/5 text-cyan-400 w-10 h-10 rounded-full flex items-center justify-center border border-white/5 opacity-50">
              <FaDiscord className="text-lg" />
            </div>
            <div className="bg-white/5 text-cyan-400 w-10 h-10 rounded-full flex items-center justify-center border border-white/5 opacity-50">
              <FaEnvelope className="text-lg" />
            </div>
          </div>

          {/* Copyright - Compact */}
          <div className="text-center">
            <p className="text-gray-400 text-xs">© 2025 GannetX</p>
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-white/5 border border-white/5 text-cyan-400 text-xs">
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
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-70"></div>
            <div
              className="absolute top-0 h-px w-20 animate-gradient-x"
              style={{
                boxShadow: '0 0 8px 1px rgba(0, 229, 255, 0.3)',
                background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.5), transparent)'
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
              <div className="mt-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-cyan-400 text-xs font-medium">
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
                  className="group bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border border-white/5"
                >
                  <FaTwitter className="transform group-hover:-translate-y-1 transition-transform duration-300" />
                </a>
                <a
                  href="https://t.me/gannetx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border border-white/5"
                >
                  <FaTelegram className="transform group-hover:-translate-y-1 transition-transform duration-300" />
                </a>
                <div className="group bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border border-white/5 cursor-pointer">
                  <FaDiscord className="transform group-hover:-translate-y-1 transition-transform duration-300" />
                </div>
                <div className="group bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border border-white/5 cursor-pointer">
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