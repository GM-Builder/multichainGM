"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { formatAddress } from "@/utils/web3"
import ThemeToggle from "./ThemeToggle"
import {
  FaSignOutAlt,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaCopy,
} from "react-icons/fa"
import ConnectWalletButton from "./ConnectWalletButton"
import ChainLogo from "@/components/ChainLogo"
import { FaTrophy } from 'react-icons/fa';

const LOGO_PATH = "/logo.png"

interface NetworkInfo {
  name: string;
  logoUrl: string;
}

interface NavbarProps {
  address: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  isConnecting: boolean
  scrollToLeaderboard?: () => void
  scrollToMintSection?: () => void
  networkInfo?: NetworkInfo | null
}

const getAvatarUrl = (address: string): string => `https://api.dicebear.com/6.x/identicon/svg?seed=${address}`

const Navbar: React.FC<NavbarProps> = ({
  address,
  connectWallet,
  disconnectWallet,
  isConnecting,
  scrollToLeaderboard,
  scrollToMintSection,
  networkInfo = null
}) => {
  const [showCopyToast, setShowCopyToast] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setIsDropdownOpen(true)
  }

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsDropdownOpen(false)
    }, 300)
    setHoverTimeout(timeout as unknown as NodeJS.Timeout)
  }

  const copyAddressToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setShowCopyToast(true)
      setTimeout(() => setShowCopyToast(false), 2000)
    }
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-20 transition-all duration-500 ${
          scrolled 
            ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md shadow-cyan-500/30" 
            : "bg-transparent"
        }`}
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-20">
          <div className={`flex justify-between items-center transition-all duration-500
              ${scrolled ? 'h-16 md:h-20' : 'h-20 md:h-28'}` 
            }
          >
            <div className="flex items-center">
              <div className="flex items-center gap-2 cursor-pointer">
                <div 
                  className={`flex-shrink-0 relative transition-all duration-500 ${
                    scrolled 
                      ? "h-14 md:h-16 w-32 md:w-40" // Ukuran kecil (scrolled): Tinggi h-12, Lebar w-40
                      : "h-16 md:h-24 w-48 md:w-64" // Ukuran BESAR (normal): Tinggi h-20, Lebar w-64
                  }`}
                >
                  <img 
                    src={LOGO_PATH}
                    alt="GannetX Logo"
                    // object-contain penting agar logo horizontal tidak terpotong
                    className="h-full w-full object-contain" 
                  />
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {/* Leaderboard Button */}
              {scrollToLeaderboard && (
                <button
                  onClick={scrollToLeaderboard}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30 border border-yellow-200/50 dark:border-yellow-700/30 rounded-lg transition-all duration-200 shadow-sm"
                >
                  <FaTrophy className="text-yellow-600 dark:text-yellow-400 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Leaderboard</span>
                </button>
              )}
              <ThemeToggle />
              {networkInfo && (
                <div className="flex items-center px-3 py-1.5 rounded-full bg-gray-100/80 dark:bg-gray-800/80 text-sm text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 shadow-inner backdrop-blur-sm">
                  <div className="mr-2 text-lg">
                    {networkInfo && (
                      <ChainLogo 
                        logoUrl={networkInfo.logoUrl}
                        altText={networkInfo.name}
                        size="md"
                        fallbackIcon="🔗"
                      />
                    )}
                  </div>
                  <span>{networkInfo?.name || 'Unknown Network'}</span>
                </div>
              )}

              {!address ? (
                <ConnectWalletButton connectWallet={connectWallet} />
              ) : (
                <div
                  ref={dropdownRef}
                  className="relative"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button className="flex items-center gap-2 bg-white dark:bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-cyan-900/10 transition-colors border border-gray-200 dark:border-cyan-500/20 shadow-sm">
                    <div className="h-5 w-5 rounded-full overflow-hidden flex-shrink-0">
                      {address && (
                        <img 
                          src={getAvatarUrl(address)} 
                          alt="Avatar" 
                          className="h-full w-full"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-cyan-300">
                      {formatAddress(address)}
                    </span>
                    <FaChevronDown
                      className={`h-3 w-3 text-cyan-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-white dark:bg-black/80 backdrop-blur-md border border-gray-200 dark:border-cyan-500/20 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-cyan-500/20 bg-gray-50 dark:bg-cyan-900/10">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full overflow-hidden">
                            {address && (
                              <img 
                                src={getAvatarUrl(address)} 
                                alt="Avatar" 
                                className="h-full w-full"
                              />
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                              {formatAddress(address)}
                              <button
                                onClick={copyAddressToClipboard}
                                className="ml-1 text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400"
                              >
                                <FaCopy size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={disconnectWallet}
                          className="px-4 py-3 w-full flex items-center gap-2 hover:bg-red-50 dark:hover:bg-cyan-900/10 transition-colors text-left"
                        >
                          <FaSignOutAlt className="text-red-500" size={14} />
                          <span className="text-sm text-red-500 hover:text-red-800">Disconnect</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex md:hidden items-center space-x-3">
              {networkInfo && (
                <div className="flex items-center px-2 py-1 rounded-full bg-gray-100/80 dark:bg-gray-800/80 text-xs text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 shadow-inner backdrop-blur-sm">
                  <div className="mr-1 text-sm">
                    {networkInfo && (
                      <ChainLogo 
                        logoUrl={networkInfo.logoUrl}
                        altText={networkInfo.name}
                        size="md" 
                        fallbackIcon="🔗"
                      />
                    )}
                  </div>
                  <span>{networkInfo?.name}</span>
                </div>
              )}
              
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors"
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <FaTimes className="block h-5 w-5" aria-hidden="true" />
                ) : (
                  <FaBars className="block h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div
        ref={mobileMenuRef}
        className={`fixed inset-0 top-20 bg-white dark:bg-gray-900 z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="px-4 pt-4 pb-6 space-y-6">
          <div className="flex flex-col space-y-4">
            {!address ? (
              <div className="px-2 py-2">
                <ConnectWalletButton connectWallet={connectWallet} />
              </div>
            ) : (
              <div className="px-2 py-2 flex flex-col space-y-4">
                <div className="flex items-center justify-between bg-cyan-50 dark:bg-cyan-900/30 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full overflow-hidden">
                      {address && (
                        <img 
                          src={getAvatarUrl(address)} 
                          alt="Avatar" 
                          className="h-full w-full"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-cyan-800 dark:text-cyan-300">
                      {formatAddress(address)}
                    </span>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="ml-4 p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <FaSignOutAlt className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCopyToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
          <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/90 to-teal-600/90 backdrop-blur-md px-4 py-3 rounded-lg shadow-lg border border-cyan-400/30">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-white font-medium text-sm">Address copied successfully</span>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
