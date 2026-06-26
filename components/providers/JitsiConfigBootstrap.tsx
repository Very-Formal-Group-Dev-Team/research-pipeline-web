'use client';

import { useEffect } from 'react';
import { get } from '@/lib/api/client';
import { setJitsiBaseUrl } from '@/lib/meetings/jitsi';

interface PublicConfig {
  jitsiBaseUrl?: string;
}

export default function JitsiConfigBootstrap() {
  useEffect(() => {
    void get<PublicConfig>('/public/config').then((res) => {
      if (res.data?.jitsiBaseUrl) {
        setJitsiBaseUrl(res.data.jitsiBaseUrl);
      }
    });
  }, []);

  return null;
}
