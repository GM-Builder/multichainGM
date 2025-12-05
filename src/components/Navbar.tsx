"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { formatAddress } from "@/utils/web3"
import {
  FaSignOutAlt,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaCopy,
  FaExchangeAlt,
  FaGem,
  FaRocket,
  FaComments,
} from "react-icons/fa"
import ConnectWalletButton from "./ConnectWalletButton"
import ChainLogo from "@/components/ChainLogo"
import { getMainnetChainIds, SUPPORTED_CHAINS } from '@/utils/constants'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import GannetXChatModal from './GannetXChatSidebar'

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
  currentChainId?: number | null
  onSwitchChain?: (chainId: number) => Promise<void>
}

const getAvatarUrl = (address: string): string => `https://api.dicebear.com/6.x/identicon/svg?seed=${address}`

const Navbar: React.FC<NavbarProps> = ({
  address,
  connectWallet,
  disconnectWallet,
  isConnecting,
  scrollToLeaderboard,
  scrollToMintSection,
  networkInfo = null,
  currentChainId,
  onSwitchChain,
}) => {
  const [showCopyToast, setShowCopyToast] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false)
  const [isSwitchingChain, setIsSwitchingChain] = useState(false)
  const [showDeployTooltip, setShowDeployTooltip] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const chainDropdownRef = useRef<HTMLDivElement>(null)
  const deployButtonRef = useRef<HTMLDivElement>(null)
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

      if (chainDropdownRef.current && !chainDropdownRef.current.contains(event.target as Node)) {
        setIsChainDropdownOpen(false)
      }

      if (deployButtonRef.current && !deployButtonRef.current.contains(event.target as Node)) {
        setShowDeployTooltip(false)
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

  const handleChainSwitch = async (chainId: number) => {
    if (isSwitchingChain || currentChainId === chainId) return

    setIsSwitchingChain(true)
    setIsChainDropdownOpen(false)

    try {
      const { switchToChain } = await import('@/utils/web3')
      await switchToChain(chainId)

      await new Promise(resolve => setTimeout(resolve, 1000))

      if (onSwitchChain) {
        await onSwitchChain(chainId)
      }
    } catch (error: any) {
      console.error('Failed to switch chain:', error)

      const errorMessage = error.message || 'Failed to switch network'
      console.error(errorMessage)
    } finally {
      setIsSwitchingChain(false)
    }
  }

  const mainnetChainIds = getMainnetChainIds()
  const mainnetChains = mainnetChainIds.map(id => ({
    id,
    ...SUPPORTED_CHAINS[id]
  }))

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-20 transition-all duration-500 ${scrolled
          ? "bg-[#0B0E14]/90 backdrop-blur-md"
          : "bg-transparent"
          }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className={`flex justify-between items-center transition-all duration-500
              ${scrolled ? 'h-16 md:h-20' : 'h-20 md:h-28'}`
          }
          >
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="flex items-center gap-2 cursor-pointer">
                <div
                  className={`flex-shrink-0 relative transition-all duration-500 ${scrolled
                    ? "h-12 md:h-16 w-24 md:w-28"
                    : "h-16 md:h-24 w-48 md:w-64"
                    }`}
                >
                  <img
                    src={LOGO_PATH}
                    alt="GannetX Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              {/* Deploy Button with Tooltip */}
              {address && (
              <div ref={deployButtonRef} className="relative" onMouseEnter={() => setShowDeployTooltip(true)} onMouseLeave={() => setShowDeployTooltip(false)}>
                <Link href="/deploy">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-4 py-2 bg-[#0B0E14] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300">
                    <span className="text-sm">Deploy</span>
                  </motion.button>
                </Link>
              </div>
              )}

              {/* Mint NFT Button */}
              {/* <Link href="/mint">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0B0E14] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300"
                >
                  <span>Mint NFT</span>
                </motion.button>
              </Link> */}

              {/* Chat Button */}
              {address && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsChatOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0B0E14] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300"
                >
                  <span className="text-sm">Chat</span>
                </motion.button>
              )}

              {/* Chain Switcher Dropdown */}
              {networkInfo && address && (
                <div className="relative" ref={chainDropdownRef}>
                  <button
                    onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                    disabled={isSwitchingChain}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B0E14] text-sm text-white border border-white/5 shadow-inner backdrop-blur-sm hover:bg-[#252830] transition-all duration-200 ${isSwitchingChain ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                  >
                    <div className="text-lg">
                      <ChainLogo
                        logoUrl={networkInfo.logoUrl}
                        altText={networkInfo.name}
                        size="md"
                        fallbackIcon="🔗"
                      />
                    </div>
                    <span className="max-w-[120px] truncate">{networkInfo.name}</span>
                    {isSwitchingChain ? (
                      <FaExchangeAlt className="w-3 h-3 animate-spin" />
                    ) : (
                      <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${isChainDropdownOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  <AnimatePresence>
                    {isChainDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-[#0B0E14] backdrop-blur-md border border-white/10 z-50 overflow-hidden max-h-[400px] overflow-y-auto"
                      >
                        <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                          <h3 className="text-sm font-semibold text-white">
                            Switch Network
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            Select mainnet chain
                          </p>
                        </div>

                        <div className="py-2">
                          {mainnetChains.map((chain) => {
                            const isCurrentChain = currentChainId === chain.id

                            return (
                              <button
                                key={chain.id}
                                onClick={() => handleChainSwitch(chain.id)}
                                disabled={isCurrentChain || isSwitchingChain}
                                className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 ${isCurrentChain
                                  ? 'bg-white/10 cursor-default'
                                  : 'hover:bg-white/5 cursor-pointer'
                                  } ${isSwitchingChain ? 'opacity-50' : ''}`}
                              >
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/20">
                                  <ChainLogo
                                    logoUrl={chain.logoUrl}
                                    altText={chain.chainName}
                                    size="md"
                                    fallbackIcon="🔗"
                                  />
                                </div>

                                <div className="flex-1 text-left">
                                  <div className="text-sm font-medium text-white">
                                    {chain.chainName}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {chain.nativeCurrency.symbol}
                                  </div>
                                </div>

                                {isCurrentChain && (
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Show simple network info when not connected */}
              {networkInfo && !address && (
                <div className="flex items-center px-3 py-1.5 rounded-full bg-[#0B0E14] text-sm text-white border border-white/5 shadow-inner backdrop-blur-sm">
                  <div className="mr-2 text-lg">
                    <ChainLogo
                      logoUrl={networkInfo.logoUrl}
                      altText={networkInfo.name}
                      size="md"
                      fallbackIcon="🔗"
                    />
                  </div>
                  <span>{networkInfo.name}</span>
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
                  <button className="flex items-center gap-2 bg-[#0B0E14] backdrop-blur-md px-4 py-2 rounded-lg hover:bg-[#252830] transition-colors border border-white/5 shadow-sm">
                    <div className="h-5 w-5 rounded-full overflow-hidden flex-shrink-0">
                      {address && (
                        <img
                          src={getAvatarUrl(address)}
                          alt="Avatar"
                          className="h-full w-full"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-white">
                      {formatAddress(address)}
                    </span>
                    <FaChevronDown
                      className={`h-3 w-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-[#0B0E14] backdrop-blur-md border border-white/10 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/5 bg-white/5">
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
                            <div className="text-xs text-gray-300 flex items-center">
                              {formatAddress(address)}
                              <button
                                onClick={copyAddressToClipboard}
                                className="ml-1 text-gray-400 hover:text-white"
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
                          className="px-4 py-3 w-full flex items-center gap-2 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <FaSignOutAlt className="text-red-500" size={14} />
                          <span className="text-sm text-red-500 hover:text-red-400">Disconnect</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-3">
              {networkInfo && (
                <div className="flex items-center px-2 py-1 rounded-full bg-[#0B0E14] text-xs text-white border border-white/5 shadow-inner backdrop-blur-sm">
                  <div className="mr-1 text-sm">
                    <ChainLogo
                      logoUrl={networkInfo.logoUrl}
                      altText={networkInfo.name}
                      size="md"
                      fallbackIcon="🔗"
                    />
                  </div>
                  <span className="max-w-[60px] truncate">{networkInfo.name}</span>
                </div>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-white hover:bg-white/5 transition-colors"
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 top-[64px] md:top-[80px] bg-[#0B0E14]/95 backdrop-blur-xl z-40 md:hidden overflow-y-auto border-t border-white/5"
          >
            <div className="p-4 space-y-6">
              {/* Main Actions Grid */}
              <div className="grid grid-cols-3 gap-3">
                <Link href="/deploy" onClick={() => setMobileMenuOpen(false)}>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-[#0B0E14] border border-white/5 rounded-xl text-center"
                  >
                    <FaRocket className="text-cyan-400 text-xl" />
                    <span className="text-sm font-semibold text-white">Deploy</span>
                  </motion.div>
                </Link>

                {/* <Link href="/mint" onClick={() => setMobileMenuOpen(false)}>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-[#0B0E14] border border-white/5 rounded-xl text-center"
                  >
                    <FaGem className="text-purple-400 text-xl" />
                    <span className="text-sm font-semibold text-white">Mint NFT</span>
                  </motion.div>
                </Link> */}

                {address && (
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsChatOpen(true)
                      setMobileMenuOpen(false)
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-[#0B0E14] border border-white/5 rounded-xl text-center cursor-pointer"
                  >
                    <FaComments className="text-green-400 text-xl" />
                    <span className="text-sm font-semibold text-white">Chat</span>
                  </motion.div>
                )}
              </div>

              {/* Network Switcher - Collapsible */}
              {address && networkInfo && (
                <div className="rounded-xl bg-white/5 border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-black/30 rounded-lg">
                        <ChainLogo
                          logoUrl={networkInfo.logoUrl}
                          altText={networkInfo.name}
                          size="sm"
                          fallbackIcon="🔗"
                        />
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-gray-400">Current Network</div>
                        <div className="text-sm font-semibold text-white">{networkInfo.name}</div>
                      </div>
                    </div>
                    <FaChevronDown
                      className={`text-gray-400 transition-transform duration-300 ${isChainDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isChainDropdownOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/5"
                      >
                        <div className="p-2 space-y-1 bg-black/20">
                          {mainnetChains.map((chain) => {
                            const isCurrentChain = currentChainId === chain.id
                            return (
                              <button
                                key={chain.id}
                                onClick={() => {
                                  handleChainSwitch(chain.id)
                                  setMobileMenuOpen(false)
                                }}
                                disabled={isCurrentChain || isSwitchingChain}
                                className={`w-full p-3 flex items-center gap-3 rounded-lg transition-all ${isCurrentChain
                                  ? 'bg-cyan-500/10 border border-cyan-500/20'
                                  : 'hover:bg-white/5'
                                  } ${isSwitchingChain ? 'opacity-50' : ''}`}
                              >
                                <ChainLogo
                                  logoUrl={chain.logoUrl}
                                  altText={chain.chainName}
                                  size="sm"
                                  fallbackIcon="🔗"
                                />
                                <span className={`text-sm flex-1 text-left ${isCurrentChain ? 'text-cyan-400 font-medium' : 'text-gray-300'}`}>
                                  {chain.chainName}
                                </span>
                                {isCurrentChain && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* User Profile / Connect */}
              <div className="pt-4 border-t border-white/5">
                {!address ? (
                  <div className="w-full">
                    <ConnectWalletButton connectWallet={connectWallet} />
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10">
                        <img
                          src={getAvatarUrl(address)}
                          alt="Avatar"
                          className="h-full w-full"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {formatAddress(address)}
                        </div>
                        <div className="text-xs text-green-400 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          Connected
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={disconnectWallet}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                      <FaSignOutAlt />
                      Disconnect Wallet
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copy Toast */}
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

      {/* Chat Modal */}
      <GannetXChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  )
}

export default Navbar