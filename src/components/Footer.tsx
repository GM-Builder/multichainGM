import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaLeaf, 
  FaTwitter, 
  FaDiscord, 
  FaGlobe, 
  FaEnvelope, 
  FaArrowRight, 
  FaChevronDown, 
  FaChevronUp, 
  FaFlask,
  FaGithub,
  FaRocket,
  FaUsers,
  FaTelegram
} from 'react-icons/fa';
import { IoIosStats } from "react-icons/io";
import { TfiStatsUp } from "react-icons/tfi";
import { 
  CONTRACT_ADDRESS, 
  TEA_SEPOLIA_CHAIN
} from '@/utils/constants';

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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  // Handle navigation
  const handleNav = (menu: string) => {
    if (menu === "dashboard") {
      // If already on home page, scroll to top smoothly
      if (router.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Navigate to home page and then scroll to top
        router.push("/").then(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    } else if (menu === "leaderboard") {
      // Navigate to home if not there, then scroll to leaderboard
      if (router.pathname !== "/") {
        router.push("/").then(() => {
          if (scrollToLeaderboard) {
            setTimeout(() => {
              scrollToLeaderboard();
            }, 500); // Increased timeout for better reliability
          } else {
            // Fallback ke implementasi lokal jika prop tidak tersedia
            setTimeout(() => {
              scrollToLeaderboardSection();
            }, 500);
          }
        });
      } else if (scrollToLeaderboard) {
        // If already on home page, scroll directly to leaderboard
        scrollToLeaderboard();
      } else {
        // Fallback ke implementasi lokal jika prop tidak tersedia
        scrollToLeaderboardSection();
      }
    } else if (menu === "profile") {
      // Navigate to profile page
      router.push("/profile");
    } else if (menu === "mint") {
      // If on home page, scroll to mint section with smooth behavior
      if (router.pathname === "/") {
        // Use the scrollToMintSection function as the primary method
        if (scrollToMintSection) {
          scrollToMintSection();
        } else {
          // Fallback to direct element selection if function not available
          scrollToBadgeSection();
        }
      } else {
        // Navigate to home page then scroll to mint section
        router.push("/").then(() => {
          // Use a longer timeout to ensure the page is fully loaded
          setTimeout(() => {
            if (scrollToMintSection) {
              scrollToMintSection();
            } else {
              // Fallback to direct element selection
              scrollToBadgeSection();
            }
          }, 600); // Increased timeout for more reliable scrolling after navigation
        });
      }
    }
  };

  const scrollToBadgeSection = () => {
    let headingElement = Array.from(document.querySelectorAll('h2, h3, h4'))
      .find(el => el.textContent?.includes('Digital Badge Collection'));
    
    let badgeSection: Element | null = null;
    
    if (headingElement) {
      const closestDiv = headingElement.closest('div');
      if (closestDiv) {
        badgeSection = closestDiv;
      }
    }
    if (!badgeSection) {
      badgeSection = document.querySelector('.badge-mint-section') || 
                      document.querySelector('[data-section="badge-mint"]');
    }
    if (!badgeSection) {
      badgeSection = document.querySelector('div.mb-8.mt-8:has(.text-cyan-500)');
    }
    if (!badgeSection) {
      badgeSection = document.querySelector('div:has(h2):has(.text-cyan-500)');
    }

    if (badgeSection) {
      const navbarHeight = 80; // Approximate height of navbar
      const badgeSectionPosition = badgeSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
      
      window.scrollTo({
        top: badgeSectionPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleReferralNavigation = () => {
    if (router.pathname !== "/profile") {
      router.push("/profile").then(() => {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("navigate", { 
            detail: { 
              tab: "profile", 
              subtab: "referrals" 
            } 
          }));
        }, 300);
      });
    } else {
      window.dispatchEvent(new CustomEvent("navigate", { 
        detail: { 
          tab: "profile", 
          subtab: "referrals" 
        } 
      }));
    }
  };

  const scrollToLeaderboardSection = () => {
    let headingElement = Array.from(document.querySelectorAll('h2, h3, h4'))
      .find(el => el.textContent?.includes('Leaderboard') || el.textContent?.includes('Top Users'));
    
    let leaderboardSection: Element | null = null;
    
    if (headingElement) {
      const closestDiv = headingElement.closest('div');
      if (closestDiv) {
        leaderboardSection = closestDiv;
      }
    }
    
    if (!leaderboardSection) {
      leaderboardSection = document.querySelector('.leaderboard-section') || 
                          document.querySelector('[data-section="leaderboard"]');
    }
    
    if (!leaderboardSection) {
      leaderboardSection = document.querySelector('table.leaderboard') ||
                          document.querySelector('.leaderboard-table') ||
                          document.querySelector('.ranking-table');
    }
    
    if (!leaderboardSection) {
      leaderboardSection = document.querySelector('div:has(table):has(th)');
    }
  
    if (leaderboardSection) {
      const navbarHeight = 80; // Approximate height of navbar
      const leaderboardPosition = leaderboardSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
      
      window.scrollTo({
        top: leaderboardPosition,
        behavior: 'smooth'
      });
    }
  };

  // Contract information for Tea Protocol
  const contracts = [
    {
      id: 'main',
      name: 'Main Contract',
      icon: <FaLeaf />,
      address: CONTRACT_ADDRESS,
    },
   
  ];

  return (
    <footer className="relative bg-gradient-to-b from-cyan-900/90 to-black overflow-hidden py-16">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat opacity-5 pointer-events-none"></div>
      
      {/* Glowing elements */}
      <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-cyan-500/20 blur-xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-40 left-20 w-80 h-80 rounded-full bg-cyan-600/10 blur-xl animate-pulse pointer-events-none"></div>
      
      {/* Footer top border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
      <div className="absolute top-1 left-0 w-full h-px bg-cyan-400/20"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-white/90">
          {/* Logo and main info section - Column 1 */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="relative">
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              <span className='text-cyan-400 font-semibold relative'>GannetX</span> is an on-chain ecosystem navigator that transforms daily blockchain interactions, ensuring secure and seamless multi-chain user experiences.
            </p>
          </div>
        </div>
        
        {/* Footer Bottom Section */}
        <div className="mt-16 relative">
          {/* Futuristic glowing separator with moving light effect */}
          <div className="flex-1 relative h-px w-full mb-8">
            {/* Base gradient line */}
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-70"></div>
            
            {/* Moving light effect - persis seperti contoh */}
            <div 
              className="absolute top-0 h-px w-20 animate-gradient-x" 
              style={{
                boxShadow: '0 0 8px 1px rgba(0, 229, 255, 0.6)',
                background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.8), transparent)'
              }}
            >
            </div>
          </div>
          
          {/* Footer content grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-4">
            {/* Left - Logo and social */}
            <div className="flex flex-col items-center md:items-start space-y-3">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <img 
                    src={LOGO_PATH}
                    alt="GannetX Logo"
                    className="h-18 w-36 object-contain" 
                  />
                </div>
              </div>
            </div>
            
            {/* Middle - Copyright with animated accent */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="text-gray-400 text-sm">© 2025 GannetX. All rights reserved.</div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-px bg-cyan-400 animate-pulse-width"></div>
              </div>
              
              {/* Testnet badge */}
              <div className="mt-2 px-2 py-0.5 rounded-full bg-cyan-900/30 border border-cyan-700/20 text-cyan-400 text-xs font-medium">
                GannetX
              </div>
            </div>
            
            {/* Right - links with hover effects */}
            <div className="flex flex-col items-center md:items-end gap-4"> 
            
            {/* 1. Social Media Icons Container */}
            <div className="flex space-x-4 pt-2">
              
             <a 
                href="https://x.com/gannetx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-400 hover:text-cyan-300 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border border-cyan-700/30 cursor-pointer"
                title="GannetX on X (Twitter)" 
              >
                <FaTwitter className="transform group-hover:-translate-y-1 transition-transform duration-300" />
              </a>
              <a 
                href="https://t.me/gannetx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-400 hover:text-cyan-300 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border border-cyan-700/30 cursor-pointer"
                title="GannetX on Telegram" 
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

            {/* 2. Legal Links Container (Horizontal) */}
            <div className="flex justify-center md:justify-end gap-6 text-sm">
                
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