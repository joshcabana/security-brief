import type { Metadata } from 'next';
import UpgradeClient from './UpgradeClient';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/upgrade',
  title: 'Upgrade to AI Security Brief Pro',
  description:
    'Join the AI Security Brief Pro founding cohort and get notified as soon as paid access opens.',
  openGraphTitle: 'Upgrade to AI Security Brief Pro',
  openGraphDescription:
    'Join the AI Security Brief Pro founding cohort to lock in the founding rate and get notified when paid access opens.',
  twitterTitle: 'Upgrade to AI Security Brief Pro',
  twitterDescription:
    'Join the AI Security Brief Pro founding cohort and get first access when paid subscriptions open.',
});

export default function UpgradePage() {
  return <UpgradeClient />;
}
