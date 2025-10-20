// src/pages/api/frame.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://gannetx.space';
  
  // Return Frame metadata
  res.status(200).json({
    frame: {
      version: "vNext",
      image: `${APP_URL}/frame-preview.png`,
      buttons: [
        {
          label: "Check In",
          action: "link",
          target: `${APP_URL}/farcaster`
        }
      ]
    }
  });
}