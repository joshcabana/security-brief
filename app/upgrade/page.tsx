import type { Metadata } from 'next';
import UpgradeClient from './UpgradeClient';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/upgrade',
  title: 'AI Security Brief Pro',
  description:
    'Continue to the current AI Security Brief Pro access flow.',
  openGraphTitle: 'AI Security Brief Pro',
  openGraphDescription:
    'Continue to the current AI Security Brief Pro access flow.',
  twitterTitle: 'AI Security Brief Pro',
  twitterDescription:
    'Continue to the current AI Security Brief Pro access flow.',
});

export default function UpgradePage() {
  return <UpgradeClient />;
}
