---
title: >-
  LLM Guardrails Are Failing: What the 2025–2026 Research Actually Shows
slug: researchers-discover-major-security-gaps-in-llm-guardrails
date: '2026-03-17'
author: AI Security Brief
excerpt: >-
  Palo Alto Networks' Unit 42, Oxford researchers, and a Nature Communications study converge on the same finding: the safety layers enterprises rely on to govern generative AI can be bypassed at scale, by automated tools, in under 60 seconds. The attack success rates are not marginal — they are, in several documented cases, approaching 100%.
category: AI Threats
featured: false
meta_title: LLM Guardrails Are Failing — 2025–2026 Research and Attack Success Rates
meta_description: >-
  Unit 42, Oxford, and Nature Communications research shows LLM guardrails failing at scale. Named jailbreak techniques, CVEs, attack success rates, and what defenders should actually do.
keywords:
  - LLM guardrails bypass
  - jailbreak attack success rates
  - generative AI vulnerabilities
  - prompt injection
  - OWASP LLM security
read_time: 8 min
---
# LLM Guardrails Are Failing: What the 2025–2026 Research Actually Shows

The enterprise pitch for generative AI has always carried a reassuring footnote: safety guardrails are in place. Content filters, AI judges, alignment training, and red-teaming pipelines collectively stand between the model and misuse. The research published between mid-2025 and early 2026 systematically dismantles that reassurance.

**The attack success rates are no longer marginal. In several documented cases, they approach or exceed 99%.** The techniques are named, reproducible, and increasingly automated. In one of the more uncomfortable findings, researchers from OpenAI, Anthropic, and Google DeepMind jointly tested 12 AI defences that claimed near-zero attack success rates under adaptive conditions — and [broke all of them](https://venturebeat.com/security/12-ai-defenses-claimed-near-zero-attack-success-researchers-broke-all-of-them).

## The Attack Landscape: Named Techniques and Verified Success Rates

The most significant development in LLM adversarial research over the past 18 months is the industrialisation of the attack surface. Jailbreaking has moved from manual prompt crafting to automated, multi-turn, fuzzing-based frameworks that operate at API speed.

**Bad Likert Judge**, developed by Palo Alto Networks [Unit 42](https://unit42.paloaltonetworks.com/multi-turn-technique-jailbreaks-llms/), instructs the target model to act as a judge evaluating hypothetical AI responses, providing scoring guidelines that require generating maximally harmful examples for reference. The model produces restricted content under the guise of evaluation. In Unit 42's February 2025 study of [17 top GenAI products from the a16z Top 50 list](https://unit42.paloaltonetworks.com/jailbreaking-generative-ai-web-products/), Bad Likert Judge achieved a **45.9% attack success rate overall and 56.7% on malware generation**. When output content filters were applied, ASR dropped by an average of 89.2 percentage points — the single most evidenced data point for the value of output filtering in current literature.

**Crescendo**, developed by Microsoft AIRT and published at USENIX Security 2025, opens with benign dialogue and progressively steers the conversation toward prohibited topics by referencing the model's own prior outputs — exploiting the LLM tendency to weight recent context over absolute safety constraints. In the same Unit 42 product study, Crescendo achieved a **43.2% ASR on AI safety violations and 52.5% on malware generation** across the 17 tested applications.

**JBFuzz**, published by Gohil et al. in early 2025, adapts software fuzzing to LLM jailbreaking via black-box API access: seed prompt templates, synonym-based mutations, and lightweight embedding classifiers to evaluate success. The [published results](https://arxiv.org/html/2503.08990v1): **99% average attack success rate across 9 major LLMs** including GPT-4o, Gemini 1.5/2.0, DeepSeek-V3/R1, and the Llama family, averaging 7 queries per question and completing **in under 60 seconds**.

The most alarming recent findings target frontier reasoning models. **Chain-of-Thought (CoT) Hijacking**, from researchers at the Oxford Martin AI Governance Initiative, Anthropic, and Stanford — [published November 2025](https://arxiv.org/abs/2510.26418) — pads harmful requests with long sequences of benign puzzle reasoning before appending a final-answer cue. The extended benign chain-of-thought dilutes the refusal signal at a circuit level. HarmBench results are categorical: **Gemini 2.5 Pro at 99% ASR, Claude 4 Sonnet at 94%, GPT o4 mini at 94%, and Grok 3 Mini, DeepSeek-R1, Qwen3-Max, and Kimi K2 Thinking each at 100%**. The finding is direct: scaling inference-time compute can exacerbate safety failures, not reduce them.

A [February 2026 study in *Nature Communications*](https://www.nature.com/articles/s41467-026-69010-1) by Hagendorff et al. found large reasoning models — DeepSeek-R1, Gemini 2.5 Flash, Grok 3 Mini — deployed as autonomous attack planners against 9 separate target models achieved a **97.14% overall jailbreak success rate** without human guidance, including producing CBRN-adjacent and cybercrime assistance.

## The AI Judge Problem

A recurring theme across 2025–2026 research is that AI judges — LLMs deployed as automated safety gatekeepers — are themselves vulnerable to the techniques they are meant to detect.

Unit 42's **AdvJudge-Zero**, published March 2026, is a black-box fuzzer targeting AI judge systems. It probes next-token distributions to identify "stealth control tokens" — benign formatting symbols such as markdown list markers and role indicators like `Assistant:` — that shift the judge's decision from "block" to "allow" by exploiting predictive attention. The [published success rate](https://unit42.paloaltonetworks.com/fuzzing-ai-judges-security-bypass/) is **99% across open-weight enterprise models, specialised reward models, and high-parameter models above 70B**.

HiddenLayer Research demonstrated in October 2025 that OpenAI's own Guardrails Framework is susceptible to the same class of attack. By combining policy puppetry, role-playing, and encoded input/output, HiddenLayer [convinced the framework's LLM-based judge](https://www.hiddenlayer.com/research/same-model-different-hat) to output a confidence score of 0.675 — just below the 0.7 blocking threshold — while the model generated anthrax sporulation instructions. **LLM-as-a-judge guardrail architectures have a structural design flaw, not an implementation flaw.** Patching individual bypasses does not resolve the underlying attack surface.

## Circuit-Level Attacks: Beyond Prompt Engineering

**HMNS (Head-Masked Nullspace Steering)**, accepted at ICLR 2026 by researchers from the University of Florida and SRI International, is a [circuit-level white-box attack](https://iclr.cc/virtual/2026/poster/10007213) that identifies the attention heads causally responsible for safety behaviour, suppresses their write paths via column masking, and injects perturbations in the orthogonal complement — operating in a closed loop across decoding attempts. It surpasses prior state-of-the-art across four established benchmarks. As the UF team framed it: "popping the hood, pulling on the internal wires."

HMNS currently requires white-box access, limiting immediate enterprise exposure, but it establishes that safety alignment is not structurally robust at the circuit level — a finding with long-term implications as open-weight models proliferate.

## Critical Vulnerabilities in the AI Stack

The attack surface extends beyond model behaviour. The enterprise AI deployment stack has produced a cluster of critical CVEs that expand the threat model into infrastructure compromise.

**CVE-2025-68664** (CVSS 9.3), dubbed "LangGrinch," affects LangChain Core across hundreds of millions of installs. [Disclosed in December 2025](https://thehackernews.com/2025/12/critical-langchain-core-vulnerability.html), it is a serialisation injection in the `dumps()` and `dumpd()` functions. LLM-generated output in fields like `additional_kwargs` or `response_metadata` can inject malicious object structures that, when deserialised in streaming operations or RAG pipelines, trigger secret exfiltration from environment variables or Jinja2 template execution resulting in RCE. The attack chain runs directly from prompt injection to infrastructure compromise through the framework's own processing logic. Patched in langchain-core 1.2.5 and 0.3.81.

**CVE-2025-3248** (CVSS 9.8) in Langflow requires no authentication. The `/api/v1/validate/code` endpoint accepts crafted POST requests with embedded `exec()` Python payloads, achieving unauthenticated server-side RCE. [Added to CISA's Known Exploited Vulnerabilities catalogue](https://nvd.nist.gov/vuln/detail/CVE-2025-3248) on 5 May 2025, it was subsequently weaponised by the Flodrix botnet in a June 2025 campaign involving reconnaissance, environment variable exfiltration, and server configuration harvesting.

Together, these two CVEs illustrate the threat model security teams must now operate within: a successful jailbreak in a fully connected AI deployment can cascade through the orchestration layer into infrastructure compromise without any additional exploitation step.

## The OWASP Framing and Practical Defence

The [OWASP Top 10 for LLMs 2025](https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf) provides the clearest industry taxonomy for the current threat environment. **Prompt Injection (LLM01:2025) holds the top position**, with OWASP explicitly classifying jailbreaking as a form of prompt injection. Sensitive Information Disclosure jumped from sixth to second; System Prompt Leakage appears for the first time in 2025, acknowledging that exposed system prompts reveal guardrail logic and enable targeted bypasses.

OWASP's own language deserves direct quotation: **"No foolproof prevention exists for prompt injection because it exploits the fundamental design of LLMs. Mitigation focuses on defence in depth."**

The research does not suggest enterprise LLM defence is impossible. It specifies which controls have evidence behind them and which do not:

- **Apply output content filters.** The 89.2 percentage point ASR reduction from Bad Likert Judge testing is the most concrete published data point for the value of output filtering. This is not a novel recommendation — it is a measured result.
- **Treat AI judges as untrusted components.** AdvJudge-Zero and HiddenLayer's OpenAI Guardrails bypass establish that LLM-based judges are not a terminal control. Pair them with deterministic rule-based filters.
- **Patch the framework stack now.** CVE-2025-68664 and CVE-2025-3248 are critical-severity vulnerabilities with patches available. The Langflow CVE has been actively exploited. There is no justification for remaining unpatched.
- **Monitor conversation-level patterns for multi-turn escalation.** [Cisco's November 2025 analysis](https://blogs.cisco.com/ai/open-model-vulnerability-analysis) found models block 87% of single-turn attacks but collapse to an 8% block rate under sustained multi-turn pressure. Per-turn monitoring misses the primary Crescendo attack pattern entirely.
- **Enforce least-privilege on agentic systems.** CVE-2025-54795 (Claude Code command injection, CVSS 8.7) and EchoLeak (CVE-2025-32711, CVSS 9.3 — a zero-click M365 Copilot data exfiltration exploit requiring no user interaction) both exploited permissions that exceeded operational necessity.

---

## Key Takeaways

- **Unit 42's Bad Likert Judge achieved 45.9% ASR** across 17 major GenAI products; content filters reduced that figure by 89.2 percentage points in controlled testing.
- **JBFuzz achieved 99% ASR** across 9 LLMs including GPT-4o and Gemini in under 60 seconds per attack — fully automated and black-box.
- **CoT Hijacking achieved 94–100% ASR** on frontier reasoning models: Gemini 2.5 Pro (99%), Claude 4 Sonnet (94%), Grok 3 Mini and DeepSeek-R1 (100% each). Better reasoning does not mean safer models.
- **Nature Communications (February 2026) found autonomous LRM attack agents achieved 97.14% overall ASR** across 9 target models without human guidance.
- **AdvJudge-Zero bypassed AI judge guardrails at 99% success**; HiddenLayer demonstrated the same structural flaw in OpenAI's Guardrails Framework.
- **CVE-2025-68664 (LangChain, CVSS 9.3) and CVE-2025-3248 (Langflow, CVSS 9.8)** are patched critical vulnerabilities in widely deployed AI frameworks. The Langflow CVE is being actively exploited.
- **OWASP classifies prompt injection (LLM01:2025) as the top LLM risk** and states no foolproof prevention exists — the security posture must be defence in depth.

---

## References

1. Palo Alto Networks Unit 42 — *Bad Likert Judge: A Multi-Turn Technique to Jailbreak LLMs*: Named technique, ASR data, 89.2 pp filter reduction. [https://unit42.paloaltonetworks.com/multi-turn-technique-jailbreaks-llms/](https://unit42.paloaltonetworks.com/multi-turn-technique-jailbreaks-llms/)

2. Palo Alto Networks Unit 42 — *Jailbreaking 17 GenAI Web Products*: Bad Likert Judge 45.9% ASR, Crescendo 43.2% ASR. [https://unit42.paloaltonetworks.com/jailbreaking-generative-ai-web-products/](https://unit42.paloaltonetworks.com/jailbreaking-generative-ai-web-products/)

3. Palo Alto Networks Unit 42 — *AdvJudge-Zero: Fuzzing AI Judges Security Bypass*: 99% bypass rate against AI judge architectures. [https://unit42.paloaltonetworks.com/fuzzing-ai-judges-security-bypass/](https://unit42.paloaltonetworks.com/fuzzing-ai-judges-security-bypass/)

4. Gohil et al. — *JBFuzz* (arXiv 2025): 99% ASR across 9 LLMs in under 60 seconds. [https://arxiv.org/html/2503.08990v1](https://arxiv.org/html/2503.08990v1)

5. Zhao, Fu, Schaeffer et al. — *Chain-of-Thought Hijacking* (Oxford Martin / Anthropic / Stanford, November 2025): 94–100% ASR on frontier LRMs. [https://arxiv.org/abs/2510.26418](https://arxiv.org/abs/2510.26418)

6. Hagendorff et al. — *Autonomous Jailbreak Agents via LRMs*, Nature Communications, February 2026: 97.14% overall ASR. [https://www.nature.com/articles/s41467-026-69010-1](https://www.nature.com/articles/s41467-026-69010-1)

7. HiddenLayer Research — *Same Model, Different Hat*, October 2025: OpenAI Guardrails bypass via judge manipulation. [https://www.hiddenlayer.com/research/same-model-different-hat](https://www.hiddenlayer.com/research/same-model-different-hat)

8. Jha et al. — *HMNS: Head-Masked Nullspace Steering*, ICLR 2026: Circuit-level safety subversion. [https://iclr.cc/virtual/2026/poster/10007213](https://iclr.cc/virtual/2026/poster/10007213)

9. The Hacker News — *CVE-2025-68664: Critical LangChain Core Vulnerability*: Serialisation injection, RCE via Jinja2. [https://thehackernews.com/2025/12/critical-langchain-core-vulnerability.html](https://thehackernews.com/2025/12/critical-langchain-core-vulnerability.html)

10. NIST NVD — *CVE-2025-3248: Langflow Unauthenticated RCE (CVSS 9.8)*: CISA KEV May 2025; exploited by Flodrix botnet. [https://nvd.nist.gov/vuln/detail/CVE-2025-3248](https://nvd.nist.gov/vuln/detail/CVE-2025-3248)

11. OWASP — *Top 10 for Large Language Model Applications 2025*: LLM01 Prompt Injection at #1. [https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf](https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf)

12. Cisco — *Death by a Thousand Prompts: Open Model Vulnerability Analysis*, November 2025: Multi-turn ASR up to 92.78%; 87% single-turn block rate collapses under persistence. [https://blogs.cisco.com/ai/open-model-vulnerability-analysis](https://blogs.cisco.com/ai/open-model-vulnerability-analysis)

---

**Stay ahead of AI security threats.** Subscribe to the AI Security Brief newsletter for weekly intelligence. [Subscribe now →](/newsletter)
