// src/components/providers/OnchainProviders.tsx
'use client';

import { ReactNode } from 'react';

type Props = { children: ReactNode };

// Simple wrapper - kita tidak butuh Wagmi karena sudah ada ethers.js
function OnchainProviders({ children }: Props) {
  return <>{children}</>;
}

export default OnchainProviders;