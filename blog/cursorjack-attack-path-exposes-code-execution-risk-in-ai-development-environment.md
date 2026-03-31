---
title: "CursorJack: How MCP Deeplinks Turn Cursor IDE Into a Code Execution Vector"
slug: "cursorjack-attack-path-exposes-code-execution-risk-in-ai-development-environment"
date: "2026-03-19"
author: "AI Security Brief"
excerpt: "Proofpoint Threat Research has demonstrated that a single crafted deeplink can weaponise Cursor IDE's MCP installation flow to execute arbitrary commands under a developer's full privileges — exposing the structural security gap at the heart of the Model Context Protocol ecosystem."
category: "AI Threats"
featured: false
meta_title: "CursorJack Attack: MCP Deeplinks and Code Execution Risk in Cursor IDE"
meta_description: "Proofpoint's CursorJack research shows how a single crafted MCP deeplink can execute arbitrary commands in Cursor IDE. What CISOs and security engineers need to know."
keywords:
  - CursorJack MCP deeplink attack
  - Cursor IDE security vulnerability
  - Model Context Protocol security risks
  - MCP server supply chain attack
  - AI development tooling threats
read_time: "6 min"
---

# CursorJack: How MCP Deeplinks Turn Cursor IDE Into a Code Execution Vector

The most dangerous software vulnerabilities are rarely exotic. They tend to be architectural — a design decision that made perfect sense for usability and created a structural attack surface that persists long after the original engineers moved on. CursorJack, the attack technique published by Proofpoint Threat Research on March 16, 2026, is exactly that kind of finding.

The technique requires no zero-day exploit, no privilege escalation, and no sophisticated malware infrastructure to demonstrate. It requires a crafted URL and a developer who has been conditioned — by the very workflow that makes AI-assisted development productive — to click approve.

## What Is MCP, and Why Does It Matter?

To understand CursorJack, you need to understand Model Context Protocol (MCP). Anthropic introduced MCP in late 2024 as an open standard for connecting AI assistants to external tools and data sources. The conceptual model is deliberately simple: MCP defines a client-server architecture where AI-powered applications (clients) connect to capability providers (servers) using a standardised protocol. A developer running an AI assistant can attach an MCP server that queries a database, reads a file system, executes shell commands, or calls an external API — and the AI treats those capabilities as native tools.

MCP adoption accelerated rapidly through 2025. By early 2026, the protocol had been adopted by every major AI-native code editor — Cursor, VS Code with GitHub Copilot, Windsurf — and had become effectively the connective tissue of the modern AI development stack. According to a [Zuplo State of MCP survey](https://zuplo.com/blog/mcp-survey), 72% of developers using MCP expect their usage to increase in the next twelve months, and 54% believe it will become a permanent industry standard. A quarter of MCP servers in the wild currently have no authentication at all. Security and access control was cited as the top challenge by 50% of MCP builders surveyed — before CursorJack was published.

The security implication embedded in MCP's design is not subtle: MCP servers execute commands with the permissions of the user running them. When an MCP server is configured with a `command` field, that command executes as the developer's OS-level user — SSH keys, cloud credentials, API tokens, production system access, and all.

## Cursor IDE and the Deeplink Installation Flow

Cursor is the dominant AI-native code editor. The company [crossed $2 billion in annualised revenue by February 2026](https://www.getpanto.ai/blog/cursor-ai-statistics), reached over one million daily active users, and counts more than half of the Fortune 500 among its customers. When Cursor ships a security-relevant design decision, it affects a large, technically privileged user population.

To simplify MCP server installation for end users, Cursor implemented a custom URL scheme and deeplink protocol. The deeplink structure is:

```
cursor://anysphere.cursor-deeplink/mcp/install?name=<name>&config=<base64>
```

The MCP server configuration — including the `command` to execute, its arguments, and any environment variables — is base64-encoded and embedded directly in the URL. When a user clicks a `cursor://` link in a browser, the OS hands the full URL to the Cursor executable. Cursor displays an installation dialogue showing the server name and parameters, and warns the user that the server will execute commands with the same privileges as the user. If the user clicks Install, the configuration is written to `~/.cursor/mcp.json` and the specified command is executed on every subsequent IDE launch.

This is how legitimate MCP installation works. The flow is designed to make onboarding seamless — one click in a browser, one click in Cursor, done.

## The CursorJack Attack Chain

Proofpoint Threat Research, testing as of January 19, 2026, demonstrated that this installation flow can be weaponised through social engineering, without modifying any OS-level protections or bypassing interactive prompts.

The full attack chain works as follows:

**1. Crafted deeplink delivery.** The attacker constructs a `cursor://` deeplink with a malicious `mcp.json` configuration embedded as base64. The `command` field contains an arbitrary OS command — in Proofpoint's proof-of-concept, a `curl` call that downloads and executes a Metasploit stager from attacker-controlled infrastructure.

**2. Social engineering delivery.** The deeplink is delivered via phishing email that directs the target to a landing page. JavaScript on the landing page automatically redirects the browser to the malicious `cursor://` URL, triggering the Cursor protocol handler.

**3. The indistinguishable prompt.** Cursor displays its standard MCP installation dialogue. The dialogue shows the MCP server name — which the attacker can set to anything, including "Azure DevOps" or "GitHub Actions" — and a preview of the configuration. Critically, **the installation dialogue does not differentiate between links originating from Cursor's own MCP directory and links from arbitrary, attacker-controlled sources.** The warning that commands will execute with user privileges is present, but it is identical for all deeplinks: legitimate and malicious alike. There is no visual indicator of source trust.

**4. Command execution with user privileges.** If the user clicks Install, Cursor writes the attacker's configuration to `mcp.json` and executes the embedded command immediately. Because the command is specified in the `command` field of `mcp.json`, it persists — executing again every time the IDE launches. Proofpoint's proof-of-concept resulted in a full Meterpreter reverse shell, enabling file system access, credential harvesting, and lateral movement opportunity.

**5. Alternatively: malicious remote server installation.** Attackers can also exploit Cursor's `url` parameter rather than `command`. This path installs a remote MCP server under the attacker's control, establishing a persistent foothold for MCP-specific attacks — tool poisoning, cross-server manipulation, and credential interception — with lower visibility to endpoint security controls.

No zero-click exploitation was observed by Proofpoint in default configurations. The attack requires user interaction at two points: clicking the phishing link and approving the installation prompt. This is not a limitation that limits real-world risk — it is precisely the threshold that social engineering crosses reliably.

## Why Developers Are High-Value Targets

Proofpoint's framing of developers as "potentially high-value targets" understates the case for enterprise security teams. Developer workstations carry a disproportionate concentration of sensitive material:

- **SSH keys** for production servers and internal infrastructure
- **API tokens and cloud credentials** — often stored in plaintext in `~/.cursor/mcp.json` for MCP servers that authenticate to external services
- **Source code** for proprietary systems, including security-critical components
- **Access to production systems** via tools like `kubectl`, AWS CLI, and database clients that are typically present and pre-authenticated on development machines

Beyond static credential exposure, the behavioural dimension amplifies risk. Modern AI development workflows — the constant flow of permission prompts from agents, tools, and IDE extensions — condition developers to approve prompts rapidly. Stack Overflow's 2025 Developer Survey found that 51% of professional developers use AI tools daily. The cognitive habit of approving AI-related prompts is deeply embedded in the daily workflow of the exact population CursorJack targets.

Proofpoint noted this directly: "modern development workflows, particularly those involving AI tools, may condition users to accept prompts without thorough review."

Overlay developer privileges with credential-rich workstations and prompt-approval conditioning, and the developer population becomes among the most cost-effective targets for initial access.

## A Pattern, Not an Incident

CursorJack is not an isolated vulnerability finding — it is a data point in a structural pattern that security teams should already be tracking. The attack surface created by MCP-based tooling in AI development environments has produced multiple distinct exploits within a short window:

- **CVE-2025-54136 (MCPoison)**, identified by Check Point Research, allowed a modified `.cursor/mcp.json` pushed to a shared repository to swap a legitimate MCP command for a malicious one without re-triggering any approval prompt. Fixed in Cursor 1.3.
- **CVE-2025-54135 (CurXecute)**, identified by Aim Labs, demonstrated that poisoned content inside a Slack message, when processed by Cursor's agent, could rewrite the MCP configuration file and auto-launch rogue servers — executing commands before the user has any chance to approve or reject. Fixed in Cursor 1.3.9.
- **CursorJack** (Proofpoint, March 2026) weaponises the intended installation flow rather than a discrete implementation bug — meaning it cannot be addressed through a patch alone. Cursor's vulnerability-reporting team closed the report as "out-of-scope / Not Applicable" under their policy.

The broader context matters too. The February 2026 ClawHavoc incident, in which Antiy CERT confirmed over 1,000 malicious skills in the OpenClaw AI agent framework's package registry, demonstrated that supply chain attacks transfer directly to AI agent ecosystems. MCP server directories — including Cursor's own MCP Directory — represent exactly this attack surface. A malicious server published through legitimate channels, or a legitimate server name spoofed in a deeplink, achieves the same outcome.

## Proofpoint's Assessment and Mitigations

Proofpoint published proof-of-concept code alongside its research and notified Cursor through its vulnerability-reporting channel prior to publication.

Their assessment identifies the problem as architectural rather than incidental: "The MCP ecosystem requires fundamental security improvements embedded directly into the framework architecture, rather than relying on additional security tools or user vigilance as the primary defense."

Proofpoint's four specific mitigation recommendations are:

1. **Introduce verification mechanisms for trusted MCP sources.** The installation dialogue should distinguish between servers installed from Cursor's official directory and those originating from arbitrary deeplinks. A code-signing mechanism for MCP server publishers — analogous to browser extension signing or app store verification — would establish source authenticity before any command executes.

2. **Implement stricter permission controls for command execution.** The current model grants MCP commands the full privileges of the running user. A more granular permissions model, or a containerisation approach that isolates MCP server execution from the host OS, would constrain the blast radius of a successful social engineering attempt.

3. **Improve visibility into installation parameters.** The current preview window in Cursor's installation dialogue can be exploited through excessively long command strings that push malicious arguments outside the visible area, or through obfuscation techniques that obscure the true command. Full, scrollable, decoded parameter visibility is a minimum requirement.

4. **Treat deeplinks from unknown origins with caution.** Users — and the organisations that deploy Cursor at scale — should verify the origin of any `cursor://` link before clicking. Links delivered via email, chat, or web pages outside Cursor's official documentation should be treated as untrusted until verified.

For enterprise security teams deploying Cursor across developer populations, the immediate posture should include EDR coverage on Cursor processes, monitoring for unexpected child processes spawned by the IDE, and review of `~/.cursor/mcp.json` on developer workstations for unrecognised entries. Developer workstations carry credentials that justify treating them with the same access-management rigour applied to privileged admin accounts — which means ensuring API keys, cloud credentials, and tokens stored in MCP configurations are managed through a centralised credential manager such as [1Password](https://1password.com), where access can be audited and revoked without hunting through individual `mcp.json` files.

## The Structural Implication

CursorJack exposes something that security teams should carry into every evaluation of AI development tooling: the usability design that makes a feature powerful often creates the attack surface that makes it dangerous.

MCP deeplinks are useful because they eliminate configuration friction. Cursor's seamless installation flow is useful because it removes barriers to MCP adoption. The absence of source differentiation in the installation dialogue is a feature consequence of the same simplicity that makes the flow work. Each of these design choices made sense in isolation. Together, they produce an attack chain that requires only a phishing email and a single approval click to establish persistent code execution on a developer's workstation.

The MCP specification itself — developed by Anthropic and now effectively an industry standard — does not mandate source verification, signing, or trust differentiation between server origins. Until those controls are embedded in the protocol and enforced by clients, every MCP-capable IDE inherits a version of this risk. Cursor is the largest deployment surface today. It will not be the last one exploited.

---

## Key Takeaways

- **CursorJack exploits Cursor IDE's MCP deeplink installation flow**, discovered by Proofpoint Threat Research and tested as of January 19, 2026: a single crafted `cursor://` link followed by user approval can result in arbitrary command execution with full user privileges.
- **The attack requires no zero-click exploitation** — but social engineering risk is high because modern AI development workflows condition developers to approve IDE prompts routinely.
- **The installation dialogue does not differentiate between trusted and untrusted deeplink sources**, making it impossible for users to visually identify a malicious installation request versus a legitimate one.
- **Developer workstations are high-value targets**: SSH keys, API tokens, cloud credentials, and source code access mean a successful compromise on a developer machine is frequently a direct path to production systems.
- **CursorJack is part of a pattern** — MCPoison (CVE-2025-54136), CurXecute (CVE-2025-54135), and the broader ClawHavoc supply chain incident confirm that AI development tooling ecosystems are an active, structurally vulnerable attack surface.
- **Proofpoint's conclusion is unambiguous**: MCP requires security controls at the framework architecture level — source verification, code signing, and granular permission controls — not user vigilance or bolt-on tooling.

---

## References

1. Proofpoint Threat Research — *CursorJack: Weaponizing Deeplinks to Exploit Cursor IDE* (March 16, 2026): Primary technical analysis, proof-of-concept details, and mitigation recommendations. [https://www.proofpoint.com/us/blog/threat-insight/cursorjack-weaponizing-deeplinks-exploit-cursor-ide](https://www.proofpoint.com/us/blog/threat-insight/cursorjack-weaponizing-deeplinks-exploit-cursor-ide)

2. Infosecurity Magazine — *'CursorJack' Attack Path Exposes Code Execution Risk in AI Development Environment* (March 17, 2026): News coverage by Alessandro Mascellino. [https://www.infosecurity-magazine.com/news/cursor-jack-attack-path-ai/](https://www.infosecurity-magazine.com/news/cursor-jack-attack-path-ai/)

3. Anthropic — *Introducing the Model Context Protocol* (November 2024): Original MCP specification announcement. [https://www.anthropic.com/news/model-context-protocol](https://www.anthropic.com/news/model-context-protocol)

4. Zuplo — *The State of MCP Report* (January 2026): Industry survey on MCP adoption, security challenges, and builder practices. [https://zuplo.com/blog/mcp-survey](https://zuplo.com/blog/mcp-survey)

5. Panto AI — *Cursor AI Statistics 2026* (March 2026): Cursor user growth, DAU, enterprise penetration, and revenue milestones. [https://www.getpanto.ai/blog/cursor-ai-statistics](https://www.getpanto.ai/blog/cursor-ai-statistics)

6. Truefoundry — *MCP Servers in Cursor: Setup, Configuration, and Security (2026 Guide)*: Technical overview of CVE-2025-54136 (MCPoison) and CVE-2025-54135 (CurXecute) and MCP security posture guidance. [https://www.truefoundry.com/blog/mcp-servers-in-cursor-setup-configuration-and-security-guide](https://www.truefoundry.com/blog/mcp-servers-in-cursor-setup-configuration-and-security-guide)

---

**Stay ahead of AI security threats.** Subscribe to the AI Security Brief newsletter for weekly intelligence on AI-powered attacks and defence strategies. [Subscribe now →](/newsletter)
