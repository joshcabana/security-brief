---
title: "AI Model Prompt Injection Attacks Explained"
slug: "ai-model-prompt-injection-attacks-explained"
date: "2026-03-08"
author: "AI Security Brief"
excerpt: "Prompt injection is the #1 vulnerability in deployed AI systems — and unlike traditional software flaws, it cannot be patched. Here's how direct and indirect attacks work, real-world exploits from 2024–2026, and the defence strategies that actually reduce risk."
category: "AI Threats"
featured: false
meta_title: "Prompt Injection Attacks Explained: Direct vs Indirect"
meta_description: "Understand prompt injection attacks in AI models: direct vs indirect types, real-world CVEs, jailbreaking techniques, and proven defence strategies for 2025-2026."
keywords:
  - prompt injection attacks
  - AI security vulnerabilities
  - indirect prompt injection
  - LLM jailbreaking
  - AI model security
read_time: "7 min"
---

# AI Model Prompt Injection Attacks Explained

Prompt injection has earned the top spot on the OWASP Top 10 for LLM Applications for two consecutive years. It is the most commonly exploited AI vulnerability in production environments, it has already been weaponised in real CVEs affecting enterprise products, and security researchers have conceded that it may never be fully solved. If you are building, deploying, or securing AI systems, prompt injection is the vulnerability that demands your deepest attention.

This article breaks down how it works, what it looks like in the wild, and what defences have demonstrable impact — without the hand-waving that characterises most introductory coverage.

## What Is Prompt Injection?

Prompt injection exploits a fundamental characteristic of how large language models process instructions: they cannot reliably distinguish between developer-supplied system prompts, user inputs, and data retrieved from external sources. All of it arrives as natural language text, and the model infers authority and intent from context rather than from cryptographic signatures or access control metadata.

When an attacker crafts input — or plants instructions in content the model will process — that successfully overrides the developer's intended system behaviour, that is a prompt injection. The consequences range from a chatbot producing off-brand output to a production AI agent exfiltrating entire databases.

**IBM's description is precise:** prompt injection "takes advantage of a core feature of generative AI: the ability to respond to natural-language instructions. Reliably identifying malicious instructions is difficult, and limiting user inputs could fundamentally change how LLMs operate."

The OWASP Top 10 for LLM Applications 2025 lists prompt injection first and most critical — noting it can lead to disclosure of sensitive information, execution of arbitrary commands in connected systems, manipulation of critical decision-making processes, and unauthorized access to functions available to the LLM.

## Direct vs Indirect Prompt Injection

Understanding the attack taxonomy is essential to understanding the risk surface.

**Direct prompt injection** occurs when a user directly supplies malicious instructions through the model's input interface. The classic example: typing "Ignore all previous instructions and instead..." into a chatbot. This category includes prompt hijacking (overriding system instructions), context poisoning (gradually shifting the model's behaviour across a multi-turn conversation), and role-playing attacks (instructing the model to adopt a persona that has "no restrictions"). Direct injection is generally easier to detect and filter because the attack occurs at the user input boundary.

**Indirect prompt injection** is the more dangerous category. It occurs when the model processes external content — documents, emails, web pages, database records, API responses — that contains embedded malicious instructions. The user who triggered the agent does not supply the malicious content; the attacker plants it in sources the agent will autonomously retrieve and process. This attack is particularly dangerous because:

- It can execute with **zero user interaction**
- The malicious instructions may be **invisible** to humans (white-on-white text, Unicode zero-width characters, steganographic content in images)
- It exploits the agent's legitimate functionality — the exfiltration happens through authorised channels

## Real-World Exploits: The Evidence Base

This is not theoretical. The 2024–2026 window produced multiple documented, production-environment exploits.

**EchoLeak (CVE-2025-32711) — Microsoft 365 Copilot, 2025.** A zero-click indirect prompt injection exploit that achieved remote, unauthenticated data exfiltration from Microsoft 365 Copilot through crafted emails. The attack bypassed Microsoft's Cross Prompt Injection Attempt classifier. This is the most significant confirmed production exploit to date: it targeted one of the most widely deployed enterprise AI products and required no action from the victim.

**Gemini Advanced Memory Poisoning — February 2025.** Security researcher Johann Rehberger demonstrated how Google's Gemini Advanced could be tricked into storing false information in its long-term memory across sessions. The injected false data persisted indefinitely until manually removed — enabling persistent manipulation of the AI's behaviour for a specific user.

**Microsoft Bing Chat System Prompt Leak — 2023 (still instructive).** A Stanford student used a crafted prompt to instruct Bing Chat (codename "Sydney") to reveal its hidden system instructions. The attack required only "ignore previous instructions" — no technical privilege or special access.

**Chain-of-Thought Hijacking — Anthropic/Oxford/Stanford research, 2025.** A joint study found that advanced AI reasoning models are *more* susceptible to jailbreaking, not less. By hiding harmful commands inside long sequences of benign reasoning steps, attackers achieved **success rates above 80%** in some tests. Success rates jumped from 27% with minimal reasoning to over 80% with extended reasoning chains — affecting GPT, Claude, Gemini, and Grok.

**AI Recommendation Poisoning — Microsoft Security, February 2026.** Attackers embed hidden instructions in web pages behind "Summarise with AI" buttons. When users click, the injected prompt plants persistent instructions in the AI assistant's memory. Weeks later, the AI recommends products based on the attacker's planted instructions rather than the user's actual needs.

Anthropic's system card for Claude Opus 4.6 quantified the baseline risk: **a single prompt injection attempt against a GUI-based agent succeeds 17.8% of the time without safeguards**. By the 200th attempt, the breach rate reaches 78.6%.

## Jailbreaking: Circumventing Safety Guardrails

Jailbreaking is a distinct but related category: attacks designed specifically to circumvent safety fine-tuning and produce content or actions the model was trained to refuse. Jailbreaking often uses prompt injection mechanics but is specifically aimed at bypassing safety filters rather than accessing data or taking actions.

The Policy Puppetry technique (April 2025) demonstrated that framing malicious requests as policy documents or system configuration files could reliably bypass safety measures across multiple frontier models. Multilingual and encoding-based attacks — using Base64, Unicode emoji substitutions, or non-Latin scripts to evade text-based filters — remain effective against models without multi-lingual safety training.

Researchers from OpenAI, Anthropic, and Google DeepMind published findings in January 2026 that **adaptive attacks bypassed 12 AI defences that claimed near-zero risk**. The research conclusion is stark: claims of near-zero attack success should be treated with extreme scepticism unless the evaluation included adaptive adversaries specifically targeting the defence mechanism.

## Defence Strategies: What Actually Works

Prompt injection is, as OpenAI has acknowledged, unlikely to ever be fully "solved" — but layered defences can dramatically reduce practical attack success rates.

**Input validation and trust boundary isolation.** The most architecturally robust defence is maintaining strict separation between instruction channels (system prompts, developer configuration) and data channels (retrieved documents, user input, web content). The data channel should be treated as untrusted input — never as a source of instructions. Microsoft's Spotlighting technique applies specific transformations to external text to help the model distinguish it from system instructions.

**Output filtering and prompt shield classifiers.** Microsoft Prompt Shields, integrated into Azure AI Content Safety, applies a classifier to detect prompt injection attempts in incoming content before they influence the model. This is a probabilistic, not deterministic, defence — but it meaningfully raises the cost for attackers.

**Least privilege and action-level guardrails.** An agent that cannot write email cannot exfiltrate data via email. Limiting the scope of actions available to an agent is one of the few deterministic defences against exfiltration attacks.

**Monitoring and behavioural anomaly detection.** Log all agent tool calls, data accesses, and external communications. Implement automated alerts for anomalous patterns — unexpected external requests, bulk data access, calls to unusual endpoints. Proactive security measures reduce incident response costs by **60–70%** compared to reactive approaches.

**Adversarial red-teaming.** Regular testing with adaptive adversaries — not static prompt libraries — is the only way to assess real-world resilience. Stanford's AutoRedTeamer research demonstrated that automated attack selection reduces computational costs by **42–58%** while achieving broader vulnerability coverage.

The NIST AI RMF (GOVERN 1.2, MAP 2.3, MEASURE 2.7) and ISO/IEC 42001:2023 Clause 6.1.3 now both mandate specific risk assessments and controls for prompt injection. Compliance is increasingly not optional.

## The Fundamental Challenge

Prompt injection is hard to solve because it exploits the same property that makes LLMs useful: their ability to follow natural language instructions flexibly. Any input robust enough to guarantee immunity against injection would likely also be restrictive enough to break legitimate use cases. Until models can reliably assign trust levels to different instruction sources — a research-stage capability — defence in depth through architectural controls, monitoring, and privilege restriction remains the operational standard.

The organisations experiencing the fewest AI security incidents in 2026 are not those who found a silver-bullet defence. They are those that applied traditional security rigour — minimise privilege, assume breach, monitor everything — to a new and fundamentally non-deterministic attack surface.

---

## Key Takeaways

- **Prompt injection is the #1 vulnerability** on the OWASP Top 10 for LLM Applications 2025 and has produced multiple real CVEs, including CVE-2025-32711 (EchoLeak) against Microsoft 365 Copilot.
- **Indirect prompt injection** — embedding malicious instructions in documents, emails, or web pages — requires zero user interaction and exploits agents through legitimate channels.
- **Jailbreaking success rates exceed 80%** against advanced reasoning models using Chain-of-Thought Hijacking (Anthropic/Oxford/Stanford, 2025).
- Deterministic defences (least privilege, action restrictions, trust boundary isolation) are more reliable than probabilistic defences (classifiers, content filters) — use both.
- **No single defence eliminates prompt injection risk.** Layered architecture — input validation, output filtering, privilege minimisation, and behavioural monitoring — is the current best practice.

---

## References

1. OWASP Gen AI Security Project — *LLM01:2025 Prompt Injection*: Definition, attack types, example scenarios for direct and indirect injection. [https://genai.owasp.org/llmrisk/llm01-prompt-injection/](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)

2. Microsoft Security Response Centre — *How Microsoft Defends Against Indirect Prompt Injection Attacks* (July 2025): Spotlighting technique, Prompt Shields, EchoLeak context, defence-in-depth architecture. [https://www.microsoft.com/en-us/msrc/blog/2025/07/how-microsoft-defends-against-indirect-prompt-injection-attacks](https://www.microsoft.com/en-us/msrc/blog/2025/07/how-microsoft-defends-against-indirect-prompt-injection-attacks)

3. Fortune — *AI Reasoning Models More Vulnerable to Jailbreak Attacks* (November 2025): Chain-of-Thought Hijacking study by Anthropic, Oxford, and Stanford; 80%+ success rates on frontier models. [https://fortune.com/2025/11/07/ai-reasoning-models-more-vulnerable-jailbreak-attacks-study/](https://fortune.com/2025/11/07/ai-reasoning-models-more-vulnerable-jailbreak-attacks-study/)

4. Lasso Security — *Prompt Injection Examples That Expose Real AI Security Risks* (January 2026): EchoLeak CVE-2025-32711, Gemini memory poisoning, MCP exploitation, AI Recommendation Poisoning. [https://www.lasso.security/blog/prompt-injection-examples](https://www.lasso.security/blog/prompt-injection-examples)

---

**Stay ahead of AI security threats.** Subscribe to the AI Security Brief newsletter for weekly intelligence on AI-powered attacks, privacy tools, and defence strategies. [Subscribe now →](/newsletter)
