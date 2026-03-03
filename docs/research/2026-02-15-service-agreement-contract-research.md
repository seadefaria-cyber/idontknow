# Service Agreement & Contract Research for Post

**Date:** 2026-02-15
**Context:** Post is a solo-run AI-powered clipping agency charging $10-20k/month retainers. This research covers best practices for the service agreement template outlined in the plan (Section 4b).

---

## 1. Industry-Standard Contract Clauses

### What Agencies Include

Major agencies like LYFE Marketing use **3-month initial terms** that convert to month-to-month, which aligns with Post's 30-day cancellation approach. No major agency publishes full contract templates publicly, but the industry consensus from HeyOrca, Bonsai, PandaDoc, and legal sources converges on these essential sections:

1. **Parties & effective date**
2. **Scope of services** (with explicit exclusions)
3. **Deliverables** (quantified: clips/week, platforms, revision rounds)
4. **Payment terms** (retainer amount, due date, late fees)
5. **Term & termination** (initial commitment + cancellation notice)
6. **Intellectual property / content ownership**
7. **Confidentiality**
8. **Limitation of liability**
9. **Indemnification**
10. **Dispute resolution & governing law**
11. **Force majeure / platform disclaimers**
12. **Client responsibilities & cooperation**

### Clauses Post's Current Template Is Missing

Based on the plan's Section 4b, Post's current template covers scope, payment, SLAs, passive approval, platform risk, credentials, music/copyright, content ownership, cancellation, refund, confidentiality, data retention, and dispute resolution. **Missing clauses that should be added:**

- **Limitation of liability** (with a specific dollar cap)
- **Force majeure** (platform outages, API changes, algorithm shifts)
- **Indemnification** (mutual: client indemnifies for their content, agency indemnifies for its actions)
- **IP assignment vs. license distinction** (currently says "client owns all clips" but doesn't address assignment mechanics)
- **Non-solicitation** (protect Sean's systems/processes)
- **Portfolio usage rights** (currently mentioned but needs explicit clause language)
- **Governing law & venue** (currently says "binding arbitration" but no state specified)
- **Insurance disclosure** (optional but adds credibility)
- **AI tools disclosure** (emerging best practice in 2025-2026)
- **No guaranteed results** (currently a disclaimer but should be a formal warranty exclusion)

### Recommended: AI Disclosure Clause (2025-2026 Emerging Standard)

Per the InfluenceFlow 2026 guide, if the agency uses AI but doesn't disclose it, that's potentially deceptive. Post should include:

> **AI Tools Disclosure.** Post utilizes artificial intelligence tools for clip identification, caption generation, and content processing. AI-generated outputs are reviewed by Post's team before distribution. Client acknowledges and consents to the use of AI tools in the production of Deliverables.

---

## 2. Liability Limitations

### Recommended Cap Structure

For a $10-20k/month retainer, the industry standard approach is:

| Approach | Cap Amount | Best For |
|----------|-----------|----------|
| **1x monthly fee** | $10-20k | Conservative, common for project work |
| **3x monthly fee** | $30-60k | **Recommended for Post** — proportional to ongoing relationship |
| **6-month fees** | $60-120k | Upper bound for retainer relationships |
| **12-month fees** | $120-240k | Excessive for a solo agency |

**Recommendation for Post: Cap at fees paid in the preceding 3 months.** This creates proportionality — if the client has only been with Post for 1 month, liability is capped at 1 month's fee. For long-term clients, it caps at 3 months. This is the sweet spot for a solo agency: meaningful enough that clients take it seriously, but not so high that one mistake bankrupts Sean.

### Recommended Clause Language

> **Limitation of Liability.**
>
> (a) **Cap.** IN NO EVENT SHALL EITHER PARTY'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED THE TOTAL FEES ACTUALLY PAID BY CLIENT TO POST IN THE THREE (3) MONTH PERIOD IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
>
> (b) **Exclusion of Consequential Damages.** IN NO EVENT SHALL EITHER PARTY BE LIABLE TO THE OTHER FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF REVENUE, LOSS OF FOLLOWERS, LOSS OF ENGAGEMENT, LOSS OF BUSINESS OPPORTUNITIES, OR REPUTATIONAL HARM, HOWEVER CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, EVEN IF SUCH PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
>
> (c) **Exceptions.** The limitations in this Section shall not apply to: (i) a party's indemnification obligations under this Agreement; (ii) a party's breach of its confidentiality obligations; or (iii) liability arising from a party's willful misconduct or gross negligence.

### "Super Cap" for Confidentiality Breaches

If Sean leaks a client's unreleased content or vice versa, the standard cap may be inadequate. Consider a "super cap" for confidentiality breaches at 2x the standard cap (i.e., 6 months of fees). This is common in agency contracts.

---

## 3. Force Majeure

### Should Post Include It?

**Yes, absolutely.** Social media agencies are uniquely dependent on third-party platforms that can change rules, go down, or restrict access without warning. Examples from 2025-2026:

- TikTok's 14-hour outage (January 2025)
- Instagram's algorithm penalizing 10+ reposts in 30 days (2025)
- YouTube Content ID false positives on royalty-free music
- Facebook demoting "unoriginal" repurposed content (2025)
- API deprecations blocking content uploads

A standard force majeure clause (earthquakes, wars) is insufficient. Post needs a **social-media-specific force majeure clause**.

### Recommended Clause Language

> **Force Majeure.**
>
> (a) Neither party shall be liable for any failure or delay in performance of its obligations under this Agreement to the extent such failure or delay results from circumstances beyond the party's reasonable control, including but not limited to: acts of God; natural disasters; epidemics or pandemics; government actions or orders; war or terrorism; labor disputes; internet or telecommunications failures; **platform outages, downtime, or service disruptions on any Third-Party Platform (including TikTok, Instagram, YouTube, X, or their parent companies)**; **changes to Third-Party Platform terms of service, algorithms, APIs, content policies, or distribution mechanisms**; **account restrictions, suspensions, shadow-bans, or demonetization imposed by Third-Party Platforms**; **deprecation or removal of Third-Party Platform features or integrations relied upon by Post**; and cyberattacks or data breaches affecting Post's service providers.
>
> (b) The affected party shall promptly notify the other party of the force majeure event and its expected duration, and shall use commercially reasonable efforts to mitigate the impact on the services.
>
> (c) If a force majeure event continues for more than thirty (30) consecutive days, either party may terminate this Agreement upon written notice without penalty.
>
> (d) **For clarity:** Routine algorithm fluctuations causing gradual changes in content performance (such as lower reach or engagement) do not constitute a force majeure event. This clause applies only to events that materially prevent or impair Post's ability to produce or distribute Deliverables.

### Why Section (d) Matters

Without section (d), a client could argue that any drop in engagement is "force majeure" and demand a refund. The distinction between "platform broke / banned the account" (force majeure) vs. "the algorithm doesn't love this content" (normal business risk) is critical.

---

## 4. IP Assignment vs. License

### The Core Question

Post's current plan says "Client owns all raw content and clips." This needs to be more precise. There are two approaches:

| Approach | What It Means | Pros for Post | Cons for Post |
|----------|--------------|---------------|---------------|
| **Assignment** | Client owns the clips outright. Full copyright transfer. | Simpler. Client is happy. Standard in work-for-hire. | Post has zero rights without explicit carve-out. Can't use clips in portfolio without permission. |
| **License** | Post creates clips, retains copyright, grants client an exclusive perpetual license. | Post retains portfolio rights automatically. Can revoke on non-payment. | Clients at $10-20k/month expect to own the work. Creates friction. Unusual for agency relationships. |

### Recommendation: Assignment with a Portfolio License-Back

**Assign ownership to the client, but reserve a non-exclusive license for Post's portfolio and marketing.** This is the industry standard for agencies. The client gets what they're paying for (ownership), and Post keeps the ability to showcase the work.

### Recommended Clause Language

> **Content Ownership & Intellectual Property.**
>
> (a) **Client Content.** Client retains all right, title, and interest in and to all raw content, source materials, brand assets, and other materials provided by Client to Post ("Client Content").
>
> (b) **Deliverables.** Upon full payment of all applicable fees, Post hereby assigns to Client all right, title, and interest in and to the clips, edited videos, and other deliverables created by Post under this Agreement ("Deliverables"), including all copyrights therein. Prior to full payment, Post retains ownership of all Deliverables.
>
> (c) **Post's Tools and Methods.** Notwithstanding the foregoing, Post retains all right, title, and interest in its proprietary tools, workflows, methodologies, templates, caption frameworks, scheduling strategies, and general know-how developed prior to or during the engagement ("Post IP"). Nothing in this Agreement transfers ownership of Post IP to Client.
>
> (d) **Portfolio License.** Client grants Post a non-exclusive, perpetual, royalty-free, worldwide license to use, display, and reproduce the Deliverables (and Client's name, logo, and likeness in connection therewith) solely for Post's portfolio, website, social media, case studies, award submissions, and marketing purposes. Post shall not use Deliverables that have not been publicly released by Client. Post may replace any copyrighted audio in portfolio versions with royalty-free alternatives.

### Why Section (c) Matters

This is **critical** for Post. Sean's clipping methodology, caption templates, scheduling strategies, trending-sound workflows, and AI tool configurations are his competitive advantage. Without this clause, a client could argue that everything Sean created during the engagement belongs to them, including the systems and processes themselves.

---

## 5. Non-Compete / Non-Solicitation

### Two Directions to Consider

**A. Protecting Sean's tools/systems from being poached:** Should Post prevent the client from hiring Sean's systems or replicating his workflow?

**B. Preventing Post from working with competitors:** Should Post agree not to work with the client's competitors?

### Recommendation

**Include a non-solicitation of tools/methods clause. Do NOT include a non-compete.**

- A **non-compete** (agreeing not to work with competitors) would be devastating for a solo agency. If Sean agrees not to clip for any other streamer in the same game/genre, he's locked out of his best clients. Additionally, FTC scrutiny of non-competes has increased since 2024.
- A **non-solicitation of personnel** doesn't apply since Post is solo.
- What **does** make sense: protecting Post's proprietary methods from being taken in-house by the client.

### Recommended Clause Language

> **Non-Solicitation of Services.**
>
> (a) During the term of this Agreement and for twelve (12) months following its termination, Client shall not directly or indirectly solicit, recruit, or hire any contractor, employee, or subcontractor of Post who performed services under this Agreement.
>
> (b) **No Reverse Engineering of Methods.** Client acknowledges that Post's workflows, AI tool configurations, scheduling strategies, caption frameworks, and content production methodologies constitute Post's confidential proprietary information. During the term and for twenty-four (24) months following termination, Client shall not use, replicate, or share Post's proprietary methods (as distinguished from general social media knowledge) for the purpose of creating an in-house clipping operation or engaging a competing service provider to replicate Post's specific processes.
>
> (c) **No Non-Compete.** For the avoidance of doubt, nothing in this Agreement restricts Post from providing services to any other client in any industry, including clients who may compete with Client.

### Enforceability Note

Section (b) is harder to enforce than a standard non-solicitation, but it serves two purposes: (1) it signals to the client that Sean's methods are proprietary and valuable, and (2) it creates a contractual basis for a claim if a client blatantly copies the entire workflow. Enforceability varies by state. In California, non-competes are largely unenforceable, but trade secret protection still applies.

---

## 6. Insurance

### What Post Needs

| Insurance Type | Need Level | What It Covers | Estimated Annual Cost |
|---------------|-----------|----------------|----------------------|
| **Professional Liability (E&O)** | **Essential** | Claims of negligence, missed deliverables, bad advice, posting wrong content | $400-$1,500/year |
| **Cyber Liability** | **Strongly recommended** | Data breaches, hacked accounts, client credential exposure | Often bundled with E&O, +$200-500/year |
| **General Liability** | **Nice to have** | Bodily injury, property damage (less relevant for remote work) | $300-$600/year |
| **Media Liability** | **Worth considering** | Copyright infringement, defamation, IP violations | Often bundled with E&O |

### Recommendation for Post

**Get a combined E&O + Cyber Liability policy.** At Post's revenue level ($10-20k+/month), the $50-125/month cost is negligible. The right providers for a solo digital agency:

- **NEXT Insurance** — Starts at $19/month for solo agencies. US-based. Quick online quotes.
- **Hiscox** — Popular with freelancers and small agencies. Good E&O coverage.
- **Berxi (Berkshire Hathaway)** — Specifically markets E&O for media and marketing professionals.

### Why E&O Matters for Post

Scenario: Sean accidentally posts an unreleased track clip to a public TikTok account before the artist's drop date. The artist claims damages. Without E&O insurance, Sean is personally on the hook. With a $500k E&O policy ($50-100/month), the insurer handles defense costs and any settlement.

### Contract Mention

Adding an insurance disclosure to the contract isn't required, but it's a credibility signal. Optionally:

> **Insurance.** Post maintains professional liability (errors & omissions) insurance and cyber liability insurance with coverage limits appropriate to the scope of services provided under this Agreement.

---

## 7. Payment Security

### Current Setup: Stripe Invoicing

The plan already specifies Stripe with MFA, restricted API keys, and hosted invoice pages. This is solid. Additional protections to consider:

### Recommended Additional Protections

**1. Require First Month Payment Before Any Work Begins**

> **Payment Commencement.** No services shall commence until Post has received the first month's retainer payment in full. This includes the onboarding process, content strategy call, and pilot batch production.

**2. Failed Payment Auto-Suspension**

The plan already has a 14-day grace period with pause on Day 22. This is reasonable. Tighten it slightly:

> **Late Payment.**
> - Days 1-7 past due: Automatic reminder via Stripe.
> - Days 8-14 past due: Written notice that service will be suspended if payment is not received within 7 days.
> - Day 15 past due: All scheduling of new content ceases. Pre-scheduled content will still post.
> - Day 22 past due: All services suspended, including pre-scheduled content (removed from queue). Late fee of 1.5% per month accrues on the outstanding balance.
> - Day 45 past due: Agreement terminated. All client data deleted per data retention policy.

**3. No Escrow Needed**

Escrow is unnecessary for $10-20k/month retainers between a US-based agency and US-based clients. Stripe's built-in dispute resolution and chargeback protection are sufficient. Escrow adds friction and signals distrust at this price point.

**4. Annual Prepayment Discount (Optional)**

For clients who want to lock in:

> **Annual Commitment.** Client may elect to prepay twelve (12) months of retainer fees at a [5-10]% discount. Annual prepayments are non-refundable after the first 30 days.

**5. Stripe Subscription vs. Invoice**

Consider using Stripe Subscriptions (auto-charge) instead of manual invoicing. Benefits:
- Automatic billing on the 1st — no chasing payments
- Failed payment auto-retry (Stripe retries 3x over 7 days)
- Dunning emails sent automatically
- Client can update payment method without contacting Sean

---

## 8. Usage Rights for Portfolio

### Best Practices

Per Matchstick Legal's portfolio clause guidance:

1. **Only use publicly released work** — Never showcase a clip before the client has posted it
2. **Be specific about usage types** — Don't just say "portfolio use." Enumerate: website, social media, case studies, award submissions, pitch decks, conference presentations
3. **Get client name/logo permission explicitly** — The right to show the work doesn't automatically include the right to name the client
4. **Clarify no compensation owed** — State that the client isn't entitled to payment when their work appears in Post's marketing
5. **Respect confidentiality** — Don't reveal metrics, strategy details, or financial terms in case studies without permission
6. **Licensed content check** — Verify that music/sounds in portfolio clips are cleared for this use (they often aren't — hence the plan's note about replacing audio with royalty-free alternatives)

### Recommended Clause Language

(Already included in Section 4 above as subsection (d) of the IP clause. Additional detail:)

> **Portfolio & Marketing Use.**
>
> (a) Client grants Post a non-exclusive, perpetual, royalty-free, worldwide license to use, reproduce, display, and distribute the Deliverables, and to use Client's name, logo, and likeness, solely for the following purposes: (i) display on Post's website and social media profiles; (ii) inclusion in Post's pitch decks, proposals, and case studies for prospective clients; (iii) submission to industry awards, competitions, and publications; and (iv) presentation at conferences, workshops, or educational events.
>
> (b) Post shall only use Deliverables that have been publicly released by Client. Post shall not disclose Client's confidential business information (including analytics, financial terms, or strategic plans) in any portfolio or case study materials without Client's prior written consent.
>
> (c) Client is not entitled to any compensation for Post's use of Deliverables under this Section.
>
> (d) Post may replace any third-party audio in Deliverables used for portfolio purposes with royalty-free alternatives to avoid licensing complications.
>
> (e) Client may request removal of specific Deliverables from Post's portfolio by written notice, and Post shall comply within fourteen (14) days of such request.

### Why Section (e) Matters

Giving clients an opt-out for specific pieces (not a blanket revocation) is a reasonable compromise that makes clients more willing to agree to the portfolio clause upfront. It's also standard in agency contracts.

---

## 9. Indemnification

### Structure: Mutual Indemnification with Defined Triggers

Both parties should indemnify each other, but for **different things**:

| Party | Indemnifies Against | Why |
|-------|-------------------|-----|
| **Client indemnifies Post** | Claims arising from Client Content (source videos, music in source, brand claims, product claims) | Sean doesn't control what the client gives him. If the source video contains unlicensed music, the client should be on the hook. |
| **Post indemnifies Client** | Claims arising from Post's actions on client accounts (posting to wrong account, using unlicensed music Post selected, unauthorized actions) | Sean controls what he adds and where he posts. |

### Exceptions to Post's Indemnification (Critical)

Per Matchstick Legal, Post should NOT indemnify the client for:
- Content changes made by the client after Post delivered it
- Client-provided content that infringes third-party rights
- Uses outside the agreed scope (e.g., client takes a TikTok clip and uses it in a TV commercial)
- Claims arising from client's failure to comply with platform terms of service
- Force majeure events

### Recommended Clause Language

> **Indemnification.**
>
> (a) **Client Indemnification.** Client shall indemnify, defend, and hold harmless Post and its officers, agents, and contractors from and against any and all claims, damages, losses, liabilities, and expenses (including reasonable attorneys' fees) arising out of or relating to: (i) Client Content, including any claim that Client Content infringes or misappropriates any third-party intellectual property rights; (ii) any products or services marketed or promoted through the Deliverables; (iii) Client's breach of any representation, warranty, or obligation under this Agreement; and (iv) Client's failure to comply with applicable laws, regulations, or Third-Party Platform terms of service.
>
> (b) **Post Indemnification.** Post shall indemnify, defend, and hold harmless Client from and against any and all claims, damages, losses, liabilities, and expenses (including reasonable attorneys' fees) arising out of or relating to: (i) Post's unauthorized use of third-party intellectual property in the Deliverables (excluding any materials provided by Client or directed by Client); (ii) Post's willful misconduct or gross negligence in performing the services; and (iii) Post's breach of its confidentiality obligations under this Agreement.
>
> (c) **Exceptions.** Post's indemnification obligation under Section (b)(i) shall not apply to the extent that a claim arises from: (i) Client Content or materials provided or approved by Client; (ii) modifications to Deliverables made by Client or a third party after delivery; (iii) use of Deliverables outside the scope of this Agreement; or (iv) Client's instructions or specifications that caused the infringement.
>
> (d) **Procedure.** The indemnified party shall: (i) promptly notify the indemnifying party of any claim; (ii) give the indemnifying party sole control of the defense and settlement; and (iii) cooperate with the indemnifying party at the indemnifying party's expense.

### Important Note

Post's indemnification is narrower than the Client's. This is intentional and standard for service providers — Post only indemnifies for things within its control (its own IP selections, its own misconduct, its own confidentiality breaches). The client indemnifies more broadly because they are the source of the content and the beneficiary of the services.

---

## 10. Governing Law

### Options for a Solo US-Based Agency

| State | Pros | Cons |
|-------|------|------|
| **Sean's home state** | Convenient for litigation. Local attorney. Familiar courts. | May not have the most business-friendly laws. |
| **Delaware** | Sophisticated Court of Chancery. Extensive case law. Signals professionalism. | Requires a registered agent if Sean doesn't live there ($50-100/year). |
| **Wyoming** | No state income tax. Strong privacy. Low fees ($60/year annual report). | Less case law. Less familiar to clients. |
| **New York** | Very common for media/entertainment contracts. Extensive case law. | Litigation can be expensive. |

### Recommendation: Sean's Home State + Binding Arbitration

For a solo agency, the simplest and most protective approach is:

1. **Governing law = Sean's home state.** This ensures Sean can hire a local attorney and isn't forced to litigate across the country.
2. **Binding arbitration (not litigation)** as the dispute resolution mechanism. Arbitration is faster, cheaper, and more private than court.
3. **Small claims court carve-out** for amounts under $10,000 (or your state's limit). This gives Sean a fast, cheap way to collect unpaid invoices.

### Recommended Clause Language

> **Governing Law & Dispute Resolution.**
>
> (a) **Governing Law.** This Agreement shall be governed by and construed in accordance with the laws of the State of [Sean's Home State], without regard to its conflict of laws principles.
>
> (b) **Informal Resolution.** Before initiating any formal dispute resolution, the parties agree to attempt to resolve any dispute arising out of or relating to this Agreement through good-faith negotiation, including at least one video conference between the parties' principals, within thirty (30) days of written notice of the dispute.
>
> (c) **Binding Arbitration.** If the dispute is not resolved through informal negotiation, it shall be settled by binding arbitration administered by the American Arbitration Association ("AAA") under its Commercial Arbitration Rules. The arbitration shall be conducted by a single arbitrator in [Sean's city, state]. The arbitrator's decision shall be final and binding, and judgment on the award may be entered in any court of competent jurisdiction.
>
> (d) **Small Claims Exception.** Notwithstanding the foregoing, either party may bring an action in small claims court in [Sean's county, state] for any claim within the jurisdictional limits of such court.
>
> (e) **Costs.** Each party shall bear its own costs and attorneys' fees in any dispute, except that the prevailing party in any arbitration or litigation shall be entitled to recover its reasonable attorneys' fees and costs from the non-prevailing party.
>
> (f) **Injunctive Relief.** Nothing in this Section shall prevent either party from seeking temporary or preliminary injunctive relief in any court of competent jurisdiction to prevent irreparable harm pending the outcome of arbitration.

### Why Section (e) Matters ("Prevailing Party" / "Loser Pays")

At $10-20k/month retainers, a client who refuses to pay might owe $20-40k. Without a "prevailing party" clause, Sean could spend $15k in legal fees to recover $20k — making it barely worth pursuing. With this clause, if Sean wins, the client also pays Sean's legal fees, which creates a strong deterrent against non-payment.

### Why Section (f) Matters

If a client starts using Post's proprietary methods (violating Section 5's non-solicitation clause), Sean can't wait months for arbitration. He needs immediate injunctive relief from a court to stop the harm. This carve-out preserves that right.

---

## Summary: Complete Clause Checklist for Post's Service Agreement

| # | Clause | Status in Current Plan | Priority |
|---|--------|----------------------|----------|
| 1 | Scope & deliverables | Covered | -- |
| 2 | Service hours & SLA | Covered | -- |
| 3 | Payment terms & late fees | Covered | -- |
| 4 | Passive approval (72-hr) | Covered | -- |
| 5 | Platform risk disclaimer | Covered | -- |
| 6 | Credential policy (OAuth only) | Covered | -- |
| 7 | Music/copyright disclaimer | Covered | -- |
| 8 | Content ownership (assignment) | Needs refinement | High |
| 9 | Post's proprietary tools/IP | **Missing** | High |
| 10 | Portfolio usage license | Needs refinement | Medium |
| 11 | Performance disclaimer | Covered | -- |
| 12 | Cancellation (30-day) | Covered | -- |
| 13 | Refund policy | Covered | -- |
| 14 | Confidentiality (2-year) | Covered | -- |
| 15 | Data retention & deletion | Covered | -- |
| 16 | Dispute resolution | Needs refinement (add state, venue, small claims) | High |
| 17 | **Limitation of liability** | **Missing** | **Critical** |
| 18 | **Force majeure** | **Missing** | **High** |
| 19 | **Indemnification (mutual)** | **Missing** | **High** |
| 20 | **Non-solicitation** | **Missing** | **Medium** |
| 21 | **Governing law** | **Missing** | **High** |
| 22 | **AI tools disclosure** | **Missing** | **Medium** |
| 23 | **Insurance disclosure** | **Missing** | **Low** |
| 24 | Service pause by client | Covered | -- |
| 25 | Client responsibilities | Partially covered (onboarding) | Medium |

### Top 5 Actions

1. **Add limitation of liability clause** — Cap at 3 months' fees paid. Exclude consequential damages. This is the single most important missing protection.
2. **Add force majeure clause** — Platform-specific. Distinguish between "platform broke" and "algorithm changed."
3. **Add mutual indemnification** — Client indemnifies for their content; Post indemnifies for its own IP selections and misconduct.
4. **Refine IP clause** — Formal assignment of deliverables to client, with carve-out for Post's tools/methods and a portfolio license-back.
5. **Add governing law + arbitration venue** — Specify Sean's home state. Include small claims court carve-out and prevailing party fee-shifting.

---

## Sources

- [HeyOrca — 9 Most Important Sections of Every Social Media Management Contract](https://www.heyorca.com/blog/how-to-create-a-social-media-management-contract)
- [Matchstick Legal — Limitation of Liability Clauses for Creative Agencies](https://matchstick.legal/blog/limitation-liability-clause-agency-service-agreements)
- [Matchstick Legal — Agency Indemnification Clauses](https://matchstick.legal/blog/dont-be-intimidated-by-agency-indemnification-clauses)
- [Matchstick Legal — Understanding and Negotiating Your Portfolio Clause](https://matchstick.legal/blog/understanding-and-negotiating-your-portfolio-clause)
- [Selene the Lawyer — 13 Must-Have Disclaimers for Social Media Management Agreements](https://selenethelawyer.com/blog/social-media-management-agreement)
- [Selene the Lawyer — 10 Must-Haves for Your Social Media Marketing Contract](https://selenethelawyer.com/blog/social-media-marketing-contract-template)
- [InfluenceFlow — Digital Marketing Service Agreements: The Complete 2026 Guide](https://influenceflow.io/resources/digital-marketing-service-agreements-the-complete-2026-guide/)
- [Ironclad — The Social Media Management Contract](https://ironcladapp.com/journal/contracts/social-media-management-contract)
- [Legal GPS — Client vs. Agency IP Rights in Creative Services Agreements](https://www.legalgps.com/creative-services-agreement/client-vs-agency-intellectual-property-rights-ownership)
- [Influencer Marketing Hub — Ownership vs License IP Framework](https://influencermarketinghub.com/ownership-vs-license-ip-framework-influencer-campaign/)
- [Influencer Marketing Hub — Force Majeure & Morals Clauses](https://influencermarketinghub.com/force-majeure-morals-clauses-influencer-campaigns/)
- [mThink — Contractual Limitation of Liability for Digital Marketers](https://mthink.com/what-digital-marketers-need-to-know-about-contractual-limitation-of-liability-clauses/)
- [NEXT Insurance / Awisee — Business Insurance for Marketing Agencies](https://awisee.com/blog/business-insurance-for-marketing-agencies/)
- [Berxi — E&O Insurance for Media & Marketing](https://www.berxi.com/industries/media-marketing-insurance/)
- [Revelation Agency — The Force Majeure Clause](https://revelation.agency/the-force-majeure-clause/)
- [Justia — Governing Law Arbitration Clause Examples](https://contracts.justia.com/contract-clauses/governing-law-arbitration/)
- [LLCAttorney — Wyoming vs Delaware LLC Comparison 2026](https://llcattorney.com/small-business-blog/wyoming-vs-delaware-llc)
- [Taft Law — Enforcing Non-Solicitation Clauses in the Social Media Context](https://www.taftlaw.com/news-events/law-bulletins/enforcing-non-solicitation-clauses-in-the-social-media-context/)
- [A Self Guru — Best Social Media Manager Contract](https://aselfguru.com/social-media-manager-contract/)
- [Cloud Campaign — Social Media Management Contract Essential Elements](https://www.cloudcampaign.com/smm-tips/social-media-management-contract)
