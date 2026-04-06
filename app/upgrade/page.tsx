import type { Metadata } from 'next';
import UpgradeClient from './UpgradeClient';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/upgrade',
  title: 'Upgrade to AI Security Brief Pro',
  description:
    'Activate AI Security Brief Pro at the founding member rate and unlock priority advisories, deep technical briefings, and the full archive.',
  openGraphTitle: 'Upgrade to AI Security Brief Pro',
  openGraphDescription:
    'Activate AI Security Brief Pro at the founding member rate with secure Beehiiv checkout and immediate access to priority advisories, deep dives, and the full archive.',
  twitterTitle: 'Upgrade to AI Security Brief Pro',
  twitterDescription:
    'Activate AI Security Brief Pro at the founding member rate with secure checkout and full archive access.',
});

export default function UpgradePage() {
  return <UpgradeClient />;
}
