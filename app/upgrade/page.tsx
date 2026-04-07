import type { Metadata } from 'next';
import UpgradeClient from './UpgradeClient';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/upgrade',
  title: 'AI Security Brief Pro',
  description:
    'Join the Pro waitlist and get notified when paid access opens.',
  openGraphTitle: 'AI Security Brief Pro',
  openGraphDescription:
    'Join the Pro waitlist and get notified when paid access opens.',
  twitterTitle: 'AI Security Brief Pro',
  twitterDescription:
    'Join the Pro waitlist and get notified when paid access opens.',
});

export default function UpgradePage() {
  return <UpgradeClient />;
}
