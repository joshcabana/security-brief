# Phase 5: Traffic & Distribution Engine Playbook

This playbook defines the exact tactical steps to scale from the Phase 4 baseline to $3k–$8k/mo recurring revenue using free SEO channels, content repurposing, and a measured paid test.

## 1. Top 10 High-Intent Long-Tail Keywords
Instead of targeting generic terms like "AI Security", we are targeting bottom-of-funnel queries with buyer intent. Articles built around these will natively funnel users into our `ToolsMatrix` and `PaywallCTA`.
1. `best LLM firewall 2026`
2. `preventing prompt injection attacks`
3. `how to secure AI agents`
4. `zero trust for AI workloads`
5. `SOC2 compliance for AI companies`
6. `VPN for privacy and dark web research`
7. `CISO guide to generative AI risks`
8. `open source active directory attack tools`
9. `Mullvad VPN vs Tailscale enterprise`
10. `automated pentesting with AI agents`

## 2. Daily Social Repurposing Template
*Do this every single time an article drops:*

**Step 1: X (Twitter) Thread**
- *Tweet 1 (Hook):* "Most AI agents are flying blind. We just tested the leading MLSecOps firewalls against an autonomous sandbox escape. Here’s what broke immediately: 🧵"
- *Tweet 2-5:* Summarize the exploit, the blast radius, and list 2 mitigation steps.
- *Tweet 6 (CTA):* "I send a weekly briefing on AI vulnerabilities and how to patch them. Drop your email here to get the full 2026 Threat Landscape PDF: [Link to /lead-magnet]"

**Step 2: LinkedIn Carousel**
- Export the same X thread into a 5-page highly-visual PDF document using tools like Taplio or Canva.
- Use the Dark Cyber aesthetic.
- Post as a document. Add to the 1st comment: "Read the full technical breakdown here: [Link to article]"

**Step 3: YouTube Short / TikTok**
- Screen-record executing the exploit or running the `ToolsMatrix` recommendation. Voiceover the X thread text. Direct viewers to the profile link (`/lead-magnet`).

## 3. Privacy-First Analytics Setup
We use Plausible (or Umami) because our audience uses ad-blockers and despises tracking pixels.
- The script `<Script defer data-domain="aithreatbrief.com" src="https://plausible.io/js/script.js" strategy="afterInteractive" />` is now fully integrated into `app/layout.tsx`.
- *Why it matters:* It tracks outbound affiliate clicks effectively without compromising the site's privacy stance, allowing us to accurately attribute revenue to content without triggering uBlock Origin.

## 4. First-Month Paid Traffic Test Plan
- **Budget**: $500 total ($16/day for 30 days)
- **Platform**: LinkedIn Ads
- **Targeting**: Exact job titles: "Chief Information Security Officer", "Head of Application Security", "Red Team Lead". Size: 50-500 employee companies.
- **Creative Focus**: A striking dark-cyber visual of our `2026 Threat Landscape PDF`.
- **Primary KPI**: Cost Per Acquisition (CPA) under $15. If a subscriber costs $15 and 5% convert to the $9/mo Pro tier with a 12-month LTV, the campaign is wildly profitable. If the test succeeds, scale budget immediately.
