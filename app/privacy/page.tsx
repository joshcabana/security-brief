import type { Metadata } from 'next';
import {
  PRIVACY_ANALYTICS_COPY,
  resolveAnalyticsState,
} from '@/lib/analytics-config.mjs';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/privacy',
  title: 'Privacy Policy',
  description:
    'Privacy policy for AI Security Brief, covering data collection, cookies, newsletter subscriptions, and affiliate link disclosures.',
});

export default function PrivacyPage() {
  const analyticsState = resolveAnalyticsState(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN);

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh' }}>
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #080c11, #0d1117)',
          borderBottom: '1px solid #21262d',
          paddingTop: '3.5rem',
          paddingBottom: '3.5rem',
        }}
      >
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label mb-3">Legal</div>
          <h1 className="text-white mb-4">Privacy Policy</h1>
          <p className="text-lg" style={{ color: '#8b949e' }}>
            Last updated: March 2026
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">
          <section>
            <h2 className="text-white text-xl font-bold mb-4">Overview</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              AI Security Brief is an independent publication covering AI-powered cybersecurity threats, privacy tools, and defence strategies. This policy explains what data we collect, how we use it, and your rights under Australian law. We are based in Australia and operate under the Privacy Act 1988 (Cth), including the Australian Privacy Principles (APPs).
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Information we collect</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-2">Newsletter subscriptions</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  When you subscribe to our newsletter, we collect your email address. Newsletter delivery and subscriber management is handled by Beehiiv. Your email is stored on Beehiiv&apos;s servers and is subject to their privacy policy. We do not sell or share subscriber email addresses with third parties.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">Analytics</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  {analyticsState.analyticsEnabled ? (
                    <>
                      {PRIVACY_ANALYTICS_COPY.enabled} Plausible does not collect personal data, does not use cookies, and does not track users across websites. All data is aggregated and no individual visitor profiles are created. You can review Plausible&apos;s data policy at plausible.io/data-policy. Vercel, our hosting provider, also collects basic request-level data such as access logs as part of normal platform operation.
                    </>
                  ) : (
                    <>
                      {PRIVACY_ANALYTICS_COPY.disabled} We still rely on Vercel for hosting, which means Vercel collects basic request-level operational logs as part of normal platform operation.
                    </>
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">Cookies</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  {analyticsState.analyticsEnabled ? (
                    <>Plausible is cookie-free, so we do not use analytics cookies or cross-site tracking cookies on this site. Beehiiv may set cookies if you interact directly with its hosted newsletter pages or email preference flows.</>
                  ) : (
                    <>We do not use analytics or advertising cookies on this site. Beehiiv may still set cookies if you interact directly with its hosted newsletter pages or email preference flows.</>
                  )}
                </p>
              </div>
            </div>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Affiliate links</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              Some links on this site are affiliate links. When you click an affiliate link and make a purchase, we may earn a commission at no additional cost to you. Affiliate partners may use cookies or tracking pixels to attribute referrals. We recommend tools based on documented security capabilities, independent audit results, and practitioner relevance. Affiliate commissions do not determine our rankings or conclusions. For details on how we select and evaluate tools, see our Methodology page.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">How we use your information</h2>
            <ul className="space-y-2 text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              <li className="flex items-start gap-2">
                <span style={{ color: '#00b4ff' }} aria-hidden="true">&bull;</span>
                To deliver newsletter issues and updates you have subscribed to
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#00b4ff' }} aria-hidden="true">&bull;</span>
                {analyticsState.analyticsEnabled
                  ? 'To understand which briefings and tools pages are useful without building individual visitor profiles'
                  : 'To understand which content is useful based on server-level access patterns'}
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#00b4ff' }} aria-hidden="true">&bull;</span>
                To improve the site and editorial direction based on readership patterns
              </li>
            </ul>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Your rights</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              Under the Privacy Act 1988 and the Australian Privacy Principles, you have the right to access, correct, or request deletion of any personal information we hold about you. You can unsubscribe from the newsletter at any time using the unsubscribe link included in every email. For data access or deletion requests, contact us using the details below.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Third-party services</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              This site relies on the following third-party services, each with their own privacy policies:
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              <li className="flex items-start gap-2">
                <span style={{ color: '#00b4ff' }} aria-hidden="true">&bull;</span>
                <strong className="text-white">Beehiiv</strong> &mdash; newsletter delivery and subscriber management
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#00b4ff' }} aria-hidden="true">&bull;</span>
                <strong className="text-white">Vercel</strong> &mdash; site hosting and deployment
              </li>
              {analyticsState.analyticsEnabled ? (
                <li className="flex items-start gap-2">
                  <span style={{ color: '#00b4ff' }} aria-hidden="true">&bull;</span>
                  <strong className="text-white">Plausible Analytics</strong> &mdash; privacy-focused website analytics
                </li>
              ) : null}
              <li className="flex items-start gap-2">
                <span style={{ color: '#00b4ff' }} aria-hidden="true">&bull;</span>
                <strong className="text-white">GitHub</strong> &mdash; source code hosting
              </li>
            </ul>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Changes to this policy</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              We may update this privacy policy from time to time. Material changes will be noted on this page with an updated revision date.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Contact</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              If you have questions about this privacy policy or wish to exercise your rights under Australian privacy law, you can reach us via the contact details published on this site or by replying to any newsletter email.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
