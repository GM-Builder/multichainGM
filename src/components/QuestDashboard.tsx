import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInfoCircle, FaTimes, FaCheckCircle, FaChevronDown } from 'react-icons/fa';
import { useUserStats } from '@/hooks/useSubgraph';

interface WhitelistPromoBannerProps {
  address?: string | null;
}

interface FaqItem {
  q: string; 
  a: string;
}

const WhitelistPromoBanner: React.FC<WhitelistPromoBannerProps> = ({ address }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { data: userStats } = useUserStats(address || undefined);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isQualified = (userStats?.totalCheckins || 0) >= 10;
  const progress = Math.min((userStats?.totalCheckins || 0) / 10 * 100, 100);
  const faqsData: FaqItem[] = [ 
  {
    q: "When will details be announced?",
    a: "NFT supply, pricing tiers, and mint date will be revealed as the program progresses."
  },
  {
    q: "Can I use multiple chains?",
    a: "Yes, check-ins on any supported chain count toward your 10 total."
  },
  {
    q: "What if I miss a day?",
    a: "No problem. There's no daily requirement—just reach 10 total check-ins to qualify."
  },
  {
    q: "Are there different whitelist tiers?",
    a: "Yes, higher positions may unlock free mints, while others might receive discounted pricing. Details to come!"
  }
];

  useEffect(() => {
    const targetDate = new Date('2025-11-15T23:59:59').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="w-full mt-8 mb-8">
      {/* Main Banner - Minimalist Space Theme */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50"
      >
        {/* Subtle Star Field Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.2) 0%, transparent 50%),
                             radial-gradient(circle at 40% 20%, rgba(167, 139, 250, 0.2) 0%, transparent 50%)`
          }}></div>
          
          {/* Minimal Stars */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-px bg-white rounded-full opacity-40"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `twinkle ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Grid Overlay - Subtle */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 p-6 md:p-8">
          {/* Top Badge - Minimal */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm mb-6 cursor-default"
          >
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-slate-300 text-[10px] font-semibold uppercase tracking-wider">Limited Program</span>
          </motion.div>

          {/* Content Layout */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            {/* Left - Text Content */}
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight leading-tight"
              >
                Early Adopter
                <br />
                <span 
                  className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
                  style={{
                    textShadow: '0 0 30px rgba(34, 211, 238, 0.3)',
                    filter: 'brightness(1.1)'
                  }}
                >
                  NFT Whitelist
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-400 text-sm md:text-base mb-6 max-w-xl leading-relaxed"
              >
                Secure your position in the GannetX ecosystem. Complete 10 check-ins to qualify. First Come, First Served.
              </motion.p>

              {/* Stats Row - Compact */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 cursor-default"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">Requirement</div>
                    <div className="text-sm font-semibold text-cyan-400">10 Check-ins</div>
                  </div>
                </motion.div>
                
                <div className="w-px h-8 bg-slate-700/50"></div>
                
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 cursor-default"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">System</div>
                    <div className="text-sm font-semibold text-purple-400">FCFS Ranking</div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Right - Countdown & Action */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-start lg:items-end gap-3"
            >
              {/* Live Countdown - Digital Display */}
              <div className="flex flex-col gap-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider text-center lg:text-right">Program Closes</div>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                  {/* Days */}
                  <div className="flex flex-col items-center">
                    <div className="font-mono text-lg font-bold text-cyan-400 tabular-nums leading-none">
                      {formatNumber(timeLeft.days)}
                    </div>
                    <div className="text-[8px] text-slate-500 uppercase mt-0.5">days</div>
                  </div>
                  <div className="text-slate-600 text-xs">:</div>
                  {/* Hours */}
                  <div className="flex flex-col items-center">
                    <div className="font-mono text-lg font-bold text-cyan-400 tabular-nums leading-none">
                      {formatNumber(timeLeft.hours)}
                    </div>
                    <div className="text-[8px] text-slate-500 uppercase mt-0.5">hrs</div>
                  </div>
                  <div className="text-slate-600 text-xs">:</div>
                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <div className="font-mono text-lg font-bold text-cyan-400 tabular-nums leading-none">
                      {formatNumber(timeLeft.minutes)}
                    </div>
                    <div className="text-[8px] text-slate-500 uppercase mt-0.5">min</div>
                  </div>
                  <div className="text-slate-600 text-xs">:</div>
                  {/* Seconds */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      key={timeLeft.seconds}
                      initial={{ scale: 1.1, color: '#22d3ee' }}
                      animate={{ scale: 1, color: '#06b6d4' }}
                      transition={{ duration: 0.3 }}
                      className="font-mono text-lg font-bold text-cyan-400 tabular-nums leading-none"
                    >
                      {formatNumber(timeLeft.seconds)}
                    </motion.div>
                    <div className="text-[8px] text-slate-500 uppercase mt-0.5">sec</div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                onClick={() => setShowDetails(true)}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 shadow-lg shadow-cyan-500/5 hover:shadow-cyan-500/10"
              >
                <span className="text-sm font-medium text-cyan-400 group-hover:text-cyan-300 transition-colors">Learn More</span>
                <FaInfoCircle className="text-cyan-400/70 text-sm group-hover:text-cyan-300 transition-colors" />
              </motion.button>
            </motion.div>
          </div>

          {/* User Progress - Only if connected */}
          {address && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.6 }}
              className="mt-6 pt-6 border-t border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-400">Your Progress</div>
                  <div className="font-mono text-lg font-semibold text-white">
                    {userStats?.totalCheckins || 0}<span className="text-slate-500 text-sm">/10</span>
                  </div>
                </div>
                {isQualified && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30"
                  >
                    <FaCheckCircle className="text-emerald-400 text-xs" />
                    <span className="text-emerald-400 text-xs font-medium">Qualified</span>
                  </motion.div>
                )}
              </div>

              {/* Progress Bar - Sleek with Glow */}
              <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full relative"
                  style={{
                    boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)'
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </motion.div>
              </div>

              {!isQualified && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xs text-slate-500 mt-2"
                >
                  {10 - (userStats?.totalCheckins || 0)} more check-ins needed
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Expandable Details Section - Like Unfolding Paper */}
      <AnimatePresence>
  {showDetails && (
    // Backdrop & Centering Container (Modal Overlay)
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowDetails(false)}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
    >
      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl z-[101] w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top edge */}
        <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <FaInfoCircle className="text-cyan-400 text-sm" />
            </div>
            <h3 className="text-lg font-semibold text-white">Program Details</h3>
          </div>
          <button
            onClick={() => setShowDetails(false)}
            className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center transition-all duration-200 group"
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <FaTimes className="text-slate-400 group-hover:text-slate-200 text-sm" />
            </motion.div>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="px-5 py-5 space-y-5 max-h-[calc(90vh-100px)] overflow-y-auto custom-scrollbar">
          {/* How to Qualify */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <div className="w-1 h-5 bg-cyan-400 rounded-full"></div>
              How to Qualify
            </h4>
            <div className="space-y-3">
              {[
                {
                  step: "1",
                  title: "10 Check-ins",
                  desc: "Complete 10 check-ins on any supported blockchain network."
                },
                {
                  step: "2",
                  title: "Track Progress",
                  desc: "Monitor your progress in the Hero Stats or directly in the banner."
                },
                {
                  step: "3",
                  title: "Secure Position",
                  desc: "Position locked based on completion time (FCFS)."
                }
              ].map((item, idx: number) => ( // <<< idx: number ditambahkan
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
                    <span className="text-cyan-400 font-bold text-sm">{item.step}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 mb-1">{item.title}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* FCFS System */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30"
          >
            <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              First Come, First Served
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Your whitelist position is determined by when you complete your 10th check-in. Earlier qualification means a better position.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-mono bg-slate-800/50 py-2 px-3 rounded-lg">
              <span>Earlier</span>
              <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Better Position</span>
              <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Better Rewards</span>
            </div>
          </motion.div>

          {/* What to Expect */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <div className="w-1 h-5 bg-cyan-400 rounded-full"></div>
              What to Expect
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Some positions may receive free NFT mints",
                "Discounted pricing for other tiers",
                "Exclusive perks for all early adopters",
                "Details will be announced soon"
              ].map((item: string, idx: number) => ( // <<< item: string, idx: number ditambahkan
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  className="flex items-start gap-2 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                >
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span className="text-sm text-slate-300 leading-relaxed">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* FAQ (Accordion) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <div className="w-1 h-5 bg-cyan-400 rounded-full"></div>
              Frequently Asked Questions
            </h4>
            <div className="space-y-3">
              {/* Pastikan 'openFaq' dan 'setOpenFaq' didefinisikan di scope ini */}
              {/* Contoh: const [openFaq, setOpenFaq] = useState<number | null>(null); */}
              {faqsData.map((faq: FaqItem, idx: number) => ( // <<< faq: FaqItem, idx: number ditambahkan
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + idx * 0.08 }}
                  className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex justify-between items-center w-full p-4 text-left text-slate-200 hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-sm font-medium flex items-start gap-2">
                      <span className="text-cyan-400 flex-shrink-0">Q:</span>
                      <span>{faq.q}</span>
                    </span>
                    <motion.div
                      initial={false}
                      animate={{ rotate: openFaq === idx ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FaChevronDown className="text-slate-400 text-xs" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 pl-10 text-xs text-slate-400 leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Decorative bottom edge */}
        <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default WhitelistPromoBanner;