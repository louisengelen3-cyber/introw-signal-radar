# How to read these dossiers

Every quote below is verbatim, with the URL it came from. Read the quote, not the label.

Standing limits, true of every dossier in this file — not repeated per company:

- **CRM unknown is the normal case.** Public CRM detection was measured at 33% recall against
  companies that provably run a supported CRM, and Salesforce was never detected once.
  Unknown never means "no CRM" and never means "not HubSpot".
- **Partner people are not publicly observable.** 2 of 18 companies yielded any person
  evidence. Unknown never means "no partner team", and team size is never a disqualifier.
- **Every account is at its first observation.** A first observation is never a change, so no
  timing or "why now" claim is available for anyone yet.
- **Sparse evidence describes what a company publishes, not how good a prospect it is.**
- **Category classification is advisory.** It catches roughly 57% of partner-tech vendors
  out-of-sample and has never wrongly excluded a genuine target — so treat a flag as worth
  checking and the absence of one as meaning nothing.
- **A partner directory count is a lower bound**, and usually a filtered view.

# Pleo  (pleo.io)
Last checked 2026-08-24 · evidence coverage: moderate

## Commercial summary

Pleo describes itself as "The business expenses solution that empowers your people to do more. Join the thousands of companies that trust Pleo to make paying for stuff at work easier". Public pages describe a technology motion. It publishes a directory listing at least 15 partner organisations. Visible partner workflows include portal. The company appears to operate the programme itself. Public evidence does not establish CRM, partner platform or partner-team size.

## Machine interpretation (advisory — not a verdict)

State: research
  - A published directory lists at least 15 partner organisations.
  - 1 unresolved contradiction in the evidence.
  - Partner motion is visible but its commercial role is not established.
  diagnostics: 6 observations → 6 distinct claims from 1 independent source(s); coverage moderate

## Category

State: likely_target_category
  Why it may matter: The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.
  Why it may not: This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.
  Unknown: Nothing about programme size, ownership or Introw need follows from category alone.
  Known-competitor list: not listed (asserted business data, separate from the inference above)
  evidence [title_tag] "Smarter spending for your business - Pleo"  — https://www.pleo.io
  evidence [meta_description] "The business expenses solution that empowers your people to do more. Join the thousands of companies that trust Pleo to make paying for stuff at work easier"  — https://www.pleo.io

## Constructs

### commercial_materiality: weak_proxy
  Why it may matter: Partners appear to take part in winning customers or revenue, which is what makes partner operations worth tooling.
  Why it may not: It does not establish how much revenue, how many partners, or whether the motion is active today.
  Unknown: partner-sourced revenue share · number of active partners
  Source quality: 1 distinct claims from 1 independent source(s)
  · "tevreden klanten op, die op hun beurt andere bedrijven doorverwijzen naar ons bedrijf." Ben Withinshaw Bestuurder bij Surrey Hills"
      source: https://www.pleo.io/nl/partners
      proves: the company describes partners bringing it leads, deals or customers
      does NOT prove: the number of deals, or that a process exists to handle them
### operational_ownership: direct
  Why it may matter: The company appears to run the partner motion itself, so it would be the buyer of tooling rather than a participant in someone else's.
  Why it may not: Operating a programme says nothing about its size; a competitor with an excellent programme scores identically here.
  Unknown: who owns the programme internally · whether operation is shared with a distributor
  Source quality: 3 distinct claims from 1 independent source(s)
  · "bent in goed gezelschap. We werken ook samen met: Waarom partner worden van Pleo? Het allerbeste voor je klanten De veiligheid van je"
      source: https://www.pleo.io/nl/partners
      proves: the company invites organisations to join a programme it runs
      does NOT prove: that anyone joins, or that the programme is staffed
  · "your perfect accounting partner We work with trusted accounting partners to make your decision easier. Explore Pleo-approved accountants and"
      source: https://www.pleo.io/en/partner-directory
      proves: the company distinguishes and manages more than one kind of partner
      does NOT prove: how many partners exist in each type
  · "Platinum Chat support Email support Video call support Dedicated Partner Manager "I would recommend Pleo to every company that wants to save time."
      source: https://www.pleo.io/en/partners
      proves: the company supplies partners with resources, enablement or a named contact
      does NOT prove: that partners use them
### operational_surface: moderate
  Why it may matter: Visible partner workflows suggest there is machinery that software could reduce the manual cost of.
  Why it may not: A published workflow is not a used workflow, and login-walled machinery is invisible either way.
  Unknown: volume through each workflow · what sits behind the partner login
  Source quality: 2 distinct claims from 1 independent source(s)
  · "stress. Get started Explore Product Explore our Partner Portal Everything you need, in one place With Pleo’s Partner Portal, you"
      source: https://www.pleo.io/en/partners
      proves: a partner-specific operational surface exists
      does NOT prove: adoption, or that partners log into it
  · "plan for your clients Listing on Pleo Partner directory Revenue share 10% 20% Marketing New Partner Bronze Silver Gold Platinum Marketing"
      source: https://www.pleo.io/en/partners
      proves: the company pays partners for commercial outcomes
      does NOT prove: the size of the payments or how they are calculated

## Partner directory

At least 15 partner organisations publicly listed.
This is a LOWER BOUND, not a partner count. Sample: goodwille.com, surreyhillsaccountancy.co.uk, ashtonmcgill.com, infina.financial, ask-the-boss.co.uk, cosbookkeeping.co.uk
Source: https://www.pleo.io/en/partner-directory

## Programmes

### technology
  [CONFIRMED] portal
  · "Become a Pleo Technology Partner First name Last name Your email I'm interested in becoming a… Company size Select Country I agree to receive more information about the"  — https://www.pleo.io/en/become_tech_partner

## Systems and people

CRM: unknown
Partner platform: unknown
People: unknown

## Contradictions

### Operator or participant
  A: Pages describe the company recruiting its own partners.
  B: Pages also describe the company as a partner in someone else's programme.
  Effect: Partner evidence on this site may belong to another vendor's programme. Attribution must be checked before the evidence is trusted.

## What to verify next

  Q: Does this company recruit its own partners, or has it joined someone else's programme?
     why it blocks: Participant pages read exactly like operator pages, and the evidence would belong to a different company.
     where to look: Look for a "become a partner" intake form on this domain, not a partner badge.
  Q: Which CRM does the partner team use?
     why it blocks: Introw syncs into HubSpot or Salesforce; the answer is unobservable publicly about two-thirds of the time.
     where to look: Ask on the first call. Public detection is not reliable enough to be worth more effort.
  Q: Is there partner machinery behind a login that we cannot see?
     why it blocks: Deal registration and pipeline usually sit behind the partner portal, so absence of public evidence is expected rather than informative.
     where to look: Check whether a partner login exists at all; its presence implies machinery we cannot inspect.

## Retrieval health

https://pleo.io/: success
https://www.pleo.io/product: not_found
https://www.pleo.io/products: not_found
https://www.pleo.io/platform: not_found
https://www.pleo.io/pricing: success
https://www.pleo.io/compare: not_found
https://www.pleo.io/alternatives: not_found

==============================================================================

# Spendesk  (spendesk.com)
Last checked 2026-08-24 · evidence coverage: moderate

## Commercial summary

Spendesk describes itself as "Maîtrisez les dépenses de votre entreprise avec Spendesk – la solution de gestion des dépenses qui connecte tous les aspects de votre activité". No partner programme type could be identified from the pages retrieved. Visible partner workflows include partner recruitment, enablement. The company appears to operate the programme itself. Public evidence does not establish CRM, partner platform or partner-team size.

## Machine interpretation (advisory — not a verdict)

State: plausible
  - Partner evidence exists but does not support a confident reading.
  diagnostics: 4 observations → 4 distinct claims from 1 independent source(s); coverage moderate

## Category

State: likely_target_category
  Why it may matter: The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.
  Why it may not: This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.
  Unknown: Nothing about programme size, ownership or Introw need follows from category alone.
  Known-competitor list: not listed (asserted business data, separate from the inference above)
  evidence [title_tag] "La finance, connectée | Spendesk"  — https://www.spendesk.com
  evidence [meta_description] "Maîtrisez les dépenses de votre entreprise avec Spendesk – la solution de gestion des dépenses qui connecte tous les aspects de votre activité."  — https://www.spendesk.com

## Constructs

### commercial_materiality: unknown
  Unknown: partner-sourced revenue share · number of active partners
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_ownership: direct
  Why it may matter: The company appears to run the partner motion itself, so it would be the buyer of tooling rather than a participant in someone else's.
  Why it may not: Operating a programme says nothing about its size; a competitor with an excellent programme scores identically here.
  Unknown: who owns the programme internally · whether operation is shared with a distributor
  Source quality: 3 distinct claims from 1 independent source(s)
  · "to transform how they think about spend and procurement. Become a partner Why become a Spendesk partner Implement the best tool for spend"
      source: https://www.spendesk.com/partners/
      proves: the company invites organisations to join a programme it runs
      does NOT prove: that anyone joins, or that the programme is staffed
  · "improve margin across your portfolio. Become a partner Technology partners Complement your offering with best-in-class spend management and"
      source: https://www.spendesk.com/partners/
      proves: the company distinguishes and manages more than one kind of partner
      does NOT prove: how many partners exist in each type
  · "via early access to new product releases and exclusive partner enablement from our dedicated teams. Rewards for you and your clients Earn"
      source: https://www.spendesk.com/partners/
      proves: the company supplies partners with resources, enablement or a named contact
      does NOT prove: that partners use them
### operational_surface: light
  Why it may matter: Visible partner workflows suggest there is machinery that software could reduce the manual cost of.
  Why it may not: A published workflow is not a used workflow, and login-walled machinery is invisible either way.
  Unknown: volume through each workflow · what sits behind the partner login
  Source quality: 1 distinct claims from 1 independent source(s)
  · "teams. Rewards for you and your clients Earn generous revenue share, while your clients benefit from special pricing and access to our"
      source: https://www.spendesk.com/partners/
      proves: the company pays partners for commercial outcomes
      does NOT prove: the size of the payments or how they are calculated

## Programmes

None identified from the pages retrieved. This is not evidence that none exists.

## Systems and people

CRM: unknown
Partner platform: unknown
People: unknown

## What to verify next

  Q: Which CRM does the partner team use?
     why it blocks: Introw syncs into HubSpot or Salesforce; the answer is unobservable publicly about two-thirds of the time.
     where to look: Ask on the first call. Public detection is not reliable enough to be worth more effort.
  Q: Is there partner machinery behind a login that we cannot see?
     why it blocks: Deal registration and pipeline usually sit behind the partner portal, so absence of public evidence is expected rather than informative.
     where to look: Check whether a partner login exists at all; its presence implies machinery we cannot inspect.

## Retrieval health

https://spendesk.com/: success
https://www.spendesk.com/product: not_found
https://www.spendesk.com/products: not_found
https://www.spendesk.com/platform: success
https://www.spendesk.com/compare: not_found
https://www.spendesk.com/alternatives: not_found
https://www.spendesk.com/vs: not_found

==============================================================================

# PayFit  (payfit.com)
Last checked 2026-08-24 · evidence coverage: moderate

## Commercial summary

PayFit describes itself as "Simplify payroll with UK payroll software that automates tasks, saving time and reducing stress". No partner programme type could be identified from the pages retrieved. Visible partner workflows include partner recruitment, application. The company appears to operate the programme itself. Public evidence does not establish CRM, partner platform or partner-team size.

## Machine interpretation (advisory — not a verdict)

State: plausible
  - Partner evidence exists but does not support a confident reading.
  diagnostics: 4 observations → 4 distinct claims from 1 independent source(s); coverage moderate

## Category

State: likely_target_category
  Why it may matter: The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.
  Why it may not: This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.
  Unknown: Nothing about programme size, ownership or Introw need follows from category alone.
  Known-competitor list: not listed (asserted business data, separate from the inference above)
  evidence [title_tag] "UK Payroll Software for Seamless Automation | PayFit"  — https://payfit.com
  evidence [meta_description] "Simplify payroll with UK payroll software that automates tasks, saving time and reducing stress."  — https://payfit.com

## Constructs

### commercial_materiality: unknown
  Unknown: partner-sourced revenue share · number of active partners
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_ownership: direct
  Why it may matter: The company appears to run the partner motion itself, so it would be the buyer of tooling rather than a participant in someone else's.
  Why it may not: Operating a programme says nothing about its size; a competitor with an excellent programme scores identically here.
  Unknown: who owns the programme internally · whether operation is shared with a distributor
  Source quality: 3 distinct claims from 1 independent source(s)
  · "Whether you're a point solution or strategic advisor, partner with us to share leads and grow together. Fractional Support Providers"
      source: https://payfit.com/partnerships/
      proves: the company invites organisations to join a programme it runs
      does NOT prove: that anyone joins, or that the programme is staffed
  · "about building the future of payroll and HR Management. Integration Partners Integrate with us or join our Open API program to help our clients"
      source: https://payfit.com/partnerships/
      proves: the company distinguishes and manages more than one kind of partner
      does NOT prove: how many partners exist in each type
  · "more about becoming a PayFit partner, please complete the partner form on this page and a member of our partnerships team will be in"
      source: https://payfit.com/partnerships/
      proves: the company runs its own intake for partner applications, leads or deals
      does NOT prove: the volume through it, or that it is automated rather than an inbox
### operational_surface: light
  Why it may matter: Visible partner workflows suggest there is machinery that software could reduce the manual cost of.
  Why it may not: A published workflow is not a used workflow, and login-walled machinery is invisible either way.
  Unknown: volume through each workflow · what sits behind the partner login
  Source quality: 1 distinct claims from 1 independent source(s)
  · "businesses grow together. Features include co-marketing, revenue share and mutual referrals. Gain expertise The PayFit team includes CIPP"
      source: https://payfit.com/partnerships/
      proves: the company pays partners for commercial outcomes
      does NOT prove: the size of the payments or how they are calculated

## Programmes

None identified from the pages retrieved. This is not evidence that none exists.

## Systems and people

CRM: unknown
Partner platform: unknown
People: unknown

## What to verify next

  Q: Which CRM does the partner team use?
     why it blocks: Introw syncs into HubSpot or Salesforce; the answer is unobservable publicly about two-thirds of the time.
     where to look: Ask on the first call. Public detection is not reliable enough to be worth more effort.
  Q: Is there partner machinery behind a login that we cannot see?
     why it blocks: Deal registration and pipeline usually sit behind the partner portal, so absence of public evidence is expected rather than informative.
     where to look: Check whether a partner login exists at all; its presence implies machinery we cannot inspect.

## Retrieval health

https://payfit.com/: success
https://payfit.com/product: not_found
https://payfit.com/products: not_found
https://payfit.com/platform: not_found
https://payfit.com/pricing: success
https://payfit.com/compare: not_found
https://payfit.com/alternatives: not_found

==============================================================================

# Factorial  (factorialhr.com)
Last checked 2026-08-24 · evidence coverage: moderate

## Commercial summary

Factorial describes itself as "Factorial is the all-in-one business software that connects everything you need to manage your team and grow your business". Public pages describe a reseller, distributor motion under the name "Partner Program". Visible partner workflows include partner recruitment, enablement, programme tiers. The company appears to operate the programme itself. Public evidence does not establish CRM, partner platform or partner-team size.

## Machine interpretation (advisory — not a verdict)

State: high_fit_evidence
  - Partners are described as taking part in revenue, and the company appears to operate the motion itself.
  diagnostics: 6 observations → 6 distinct claims from 1 independent source(s); coverage moderate

## Category

State: likely_target_category
  Why it may matter: The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.
  Why it may not: This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.
  Unknown: Nothing about programme size, ownership or Introw need follows from category alone.
  Known-competitor list: not listed (asserted business data, separate from the inference above)
  evidence [title_tag] "Factorial | All In One Business Management Software"  — https://factorialhr.com
  evidence [meta_description] "Factorial is the all-in-one business software that connects everything you need to manage your team and grow your business."  — https://factorialhr.com

## Constructs

### commercial_materiality: confirmed
  Why it may matter: Partners appear to take part in winning customers or revenue, which is what makes partner operations worth tooling.
  Why it may not: It does not establish how much revenue, how many partners, or whether the motion is active today.
  Unknown: partner-sourced revenue share · number of active partners
  Source quality: 2 distinct claims from 1 independent source(s)
  · "our Reseller Partner By joining our program you will elevate your business"
      source: https://factorialhr.com/partners-distributors
      proves: the company describes partners selling or reselling its product
      does NOT prove: the volume of resale, or that resale revenue is material
  · "new revenue opportunities. Expand your service offering, grow your business, and boost your profitability! Become a partner Find out how to"
      source: https://factorialhr.com/partners-distributors
      proves: the company pitches partner participation as revenue for the partner
      does NOT prove: that any partner earns it, or that the company tracks it
### operational_ownership: direct
  Why it may matter: The company appears to run the partner motion itself, so it would be the buyer of tooling rather than a participant in someone else's.
  Why it may not: Operating a programme says nothing about its size; a competitor with an excellent programme scores identically here.
  Unknown: who owns the programme internally · whether operation is shared with a distributor
  Source quality: 1 distinct claims from 1 independent source(s)
  · "grow your business, and boost your profitability! Become a partner Find out how to become a Factorial Distributor Partner We explain"
      source: https://factorialhr.com/partners-distributors
      proves: the company invites organisations to join a programme it runs
      does NOT prove: that anyone joins, or that the programme is staffed
### operational_surface: moderate
  Why it may matter: Visible partner workflows suggest there is machinery that software could reduce the manual cost of.
  Why it may not: A published workflow is not a used workflow, and login-walled machinery is invisible either way.
  Unknown: volume through each workflow · what sits behind the partner login
  Source quality: 3 distinct claims from 1 independent source(s)
  · "Take a look at the benefits for each type of Partner. Silver Partner 🥈 Gold Partner 🏅 Platinum Partner 🏆 Partner commission $ $$ $$$"
      source: https://factorialhr.com/partners-distributors
      proves: the company differentiates partners by commitment or performance
      does NOT prove: how many partners sit in each tier
  · "and offers for Partner customers Co-Marketing actions Partner Academy Technical assistance and support Marketing support and materials"
      source: https://factorialhr.com/partners-distributors
      proves: the company trains or certifies people outside its own staff
      does NOT prove: that those people transact — customer academies look identical
  · "Partner 🥈 Gold Partner 🏅 Platinum Partner 🏆 Partner commission $ $$ $$$ Special sales and account support Promotions and offers"
      source: https://factorialhr.com/partners-distributors
      proves: the company pays partners for commercial outcomes
      does NOT prove: the size of the payments or how they are calculated

## Programmes

### reseller — "Partner Program"
  [CONFIRMED] partner_recruitment
  [CONFIRMED] enablement
  [CONFIRMED] programme_tiers
  · "Become our Reseller Partner By joining our program you will elevate your business potential and seize new revenue opportunities. Expand your service"  — https://factorialhr.com/partners-distributors
  · "Discover Factorial's partnership programs Choose the type of partnership that best suits your company's needs and become a partner. Reseller Referral Product Integration Reseller We partner with companies whose objective is to grow by distr"  — https://factorialhr.com/partnerships
### distributor — "Partner Program"
  · "Expand your service offering, grow your business, and boost your profitability! Become a partner Find out how to become a Factorial Distributor Partner We explain in detail what our Partner Program is all about and how to become an expert o"  — https://factorialhr.com/partners-distributors

## Systems and people

CRM: unknown
Partner platform: unknown
People: unknown

## What to verify next

  Q: Which CRM does the partner team use?
     why it blocks: Introw syncs into HubSpot or Salesforce; the answer is unobservable publicly about two-thirds of the time.
     where to look: Ask on the first call. Public detection is not reliable enough to be worth more effort.
  Q: Is there partner machinery behind a login that we cannot see?
     why it blocks: Deal registration and pipeline usually sit behind the partner portal, so absence of public evidence is expected rather than informative.
     where to look: Check whether a partner login exists at all; its presence implies machinery we cannot inspect.

## Retrieval health

https://factorialhr.com/: success
https://factorialhr.com/product: success
https://factorialhr.com/compare: not_found
https://factorialhr.com/alternatives: not_found
https://factorialhr.com/vs: not_found

==============================================================================

# Twikey  (twikey.com)
Last checked 2026-08-24 · evidence coverage: sparse

## Commercial summary

Twikey describes itself as "Easy to start with Sepa permissions. Less paperwork and hassle-free follow-up of your direct debits or invoices via your own bank account". No partner programme type could be identified from the pages retrieved. Visible partner workflows include partner recruitment. The company appears to operate the programme itself. Public evidence does not establish CRM, partner platform or partner-team size. Public evidence is sparse, so manual research is likely to be required — this is a limit of what the company publishes, not a judgement about it.

## Machine interpretation (advisory — not a verdict)

State: plausible
  - 1 unresolved contradiction in the evidence.
  - Partner evidence exists but does not support a confident reading.
  diagnostics: 2 observations → 2 distinct claims from 1 independent source(s); coverage sparse

## Category

State: likely_target_category
  Why it may matter: The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.
  Why it may not: This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.
  Unknown: Nothing about programme size, ownership or Introw need follows from category alone.
  Known-competitor list: not listed (asserted business data, separate from the inference above)
  evidence [title_tag] "e-Mandates, SEPA direct debits, online payments, collecting and following up invoices | Twikey"  — https://www.twikey.com
  evidence [meta_description] "Easy to start with Sepa permissions. Less paperwork and hassle-free follow-up of your direct debits or invoices via your own bank account."  — https://www.twikey.com

## Constructs

### commercial_materiality: unknown
  Unknown: partner-sourced revenue share · number of active partners
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_ownership: direct
  Why it may matter: The company appears to run the partner motion itself, so it would be the buyer of tooling rather than a participant in someone else's.
  Why it may not: Operating a programme says nothing about its size; a competitor with an excellent programme scores identically here.
  Unknown: who owns the programme internally · whether operation is shared with a distributor
  Source quality: 1 distinct claims from 1 independent source(s)
  · "payment journey. Contact us if you would like to become a partner or integrator! Offer smart and efficient payment solutions All"
      source: https://www.twikey.com/partners.html
      proves: the company invites organisations to join a programme it runs
      does NOT prove: that anyone joins, or that the programme is staffed
### operational_surface: light
  Why it may matter: Visible partner workflows suggest there is machinery that software could reduce the manual cost of.
  Why it may not: A published workflow is not a used workflow, and login-walled machinery is invisible either way.
  Unknown: volume through each workflow · what sits behind the partner login
  Source quality: 1 distinct claims from 1 independent source(s)
  · "relationship No discussions No more administration Faster payout Twikey - Microsoft Dynamics 365 Business Central How it works 1"
      source: https://www.twikey.com/partner/businesscentral.html
      proves: the company pays partners for commercial outcomes
      does NOT prove: the size of the payments or how they are calculated

## Programmes

None identified from the pages retrieved. This is not evidence that none exists.

## Systems and people

CRM: unknown
Partner platform: unknown
People: unknown

## Contradictions

### Operator or participant
  A: Pages describe the company recruiting its own partners.
  B: Pages also describe the company as a partner in someone else's programme.
  Effect: Partner evidence on this site may belong to another vendor's programme. Attribution must be checked before the evidence is trusted.

## What to verify next

  Q: Does this company recruit its own partners, or has it joined someone else's programme?
     why it blocks: Participant pages read exactly like operator pages, and the evidence would belong to a different company.
     where to look: Look for a "become a partner" intake form on this domain, not a partner badge.
  Q: Which CRM does the partner team use?
     why it blocks: Introw syncs into HubSpot or Salesforce; the answer is unobservable publicly about two-thirds of the time.
     where to look: Ask on the first call. Public detection is not reliable enough to be worth more effort.
  Q: Is there partner machinery behind a login that we cannot see?
     why it blocks: Deal registration and pipeline usually sit behind the partner portal, so absence of public evidence is expected rather than informative.
     where to look: Check whether a partner login exists at all; its presence implies machinery we cannot inspect.

## Retrieval health

https://twikey.com/: success
https://www.twikey.com/product: success
https://www.twikey.com/compare: not_found
https://www.twikey.com/alternatives: not_found
https://www.twikey.com/vs: not_found

==============================================================================

# Lano  (lano.io)
Last checked 2026-08-24 · evidence coverage: sparse

## Commercial summary

Lano describes itself as "Onboard and pay people in 170+ countries, and stay 100% compliant. You find the talent, we’ll take care of everything else". Public pages describe a affiliate, referral motion under the name "Partner Network". Visible partner workflows include partner recruitment. The company appears to operate the programme itself. Public evidence does not establish CRM, partner platform or partner-team size. Public evidence is sparse, so manual research is likely to be required — this is a limit of what the company publishes, not a judgement about it.

## Machine interpretation (advisory — not a verdict)

State: plausible
  - Partner evidence exists but does not support a confident reading.
  diagnostics: 2 observations → 2 distinct claims from 1 independent source(s); coverage sparse

## Category

State: likely_target_category
  Why it may matter: The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.
  Why it may not: This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.
  Unknown: Nothing about programme size, ownership or Introw need follows from category alone.
  Known-competitor list: not listed (asserted business data, separate from the inference above)
  evidence [title_tag] "Global Payroll Consolidation and EOR Platform"  — https://www.lano.io
  evidence [meta_description] "Onboard and pay people in 170+ countries, and stay 100% compliant. You find the talent, we’ll take care of everything else."  — https://www.lano.io

## Constructs

### commercial_materiality: unknown
  Unknown: partner-sourced revenue share · number of active partners
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_ownership: direct
  Why it may matter: The company appears to run the partner motion itself, so it would be the buyer of tooling rather than a participant in someone else's.
  Why it may not: Operating a programme says nothing about its size; a competitor with an excellent programme scores identically here.
  Unknown: who owns the programme internally · whether operation is shared with a distributor
  Source quality: 1 distinct claims from 1 independent source(s)
  · "Sie Lano Affiliate-Partner Werden Sie Lano Affiliate-Partner Entdecken Sie Ihre Vorteile als"
      source: https://www.lano.io/de/become-a-partner
      proves: the company invites organisations to join a programme it runs
      does NOT prove: that anyone joins, or that the programme is staffed
### operational_surface: light
  Why it may matter: Visible partner workflows suggest there is machinery that software could reduce the manual cost of.
  Why it may not: A published workflow is not a used workflow, and login-walled machinery is invisible either way.
  Unknown: volume through each workflow · what sits behind the partner login
  Source quality: 1 distinct claims from 1 independent source(s)
  · "targets to qualify Co-marketing opportunities Automated commission payouts Individual reporting with partnership insights Access to"
      source: https://www.lano.io/become-a-partner
      proves: the company pays partners for commercial outcomes
      does NOT prove: the size of the payments or how they are calculated

## Programmes

### affiliate — "Partner Network"
  [CONFIRMED] partner_recruitment
  · "Become a Lano Affiliate Partner Become a Lano Affiliate Partner! Explore your benefits when you sign up to become a Lano partner. What can Lano do for you? Free to join"  — https://www.lano.io/become-a-partner
  · "Automatisierte Provisionsauszahlungen Individuelle Reports zu Ihren Provisionen Zugang zu exklusiven Rabatten Werden Sie Lano Affiliate Partner Name E-Mail Unternehmen Website Unternehmenshauptsitz Afghanistan Åland Islands Albania Algeria "  — https://www.lano.io/de/become-a-partner
### referral — "Affiliate Program"
  · "to join, simple to set up and commitment-free. Become a partner How much can you earn? As Lano affiliate partner, you can earn generous introducer bonuses and recurring commission payments that are equal to the revenue percentage earner by "  — https://www.lano.io/affiliate-partner-program

## Systems and people

CRM: unknown
Partner platform: unknown
People: unknown

## What to verify next

  Q: Which CRM does the partner team use?
     why it blocks: Introw syncs into HubSpot or Salesforce; the answer is unobservable publicly about two-thirds of the time.
     where to look: Ask on the first call. Public detection is not reliable enough to be worth more effort.
  Q: Is there partner machinery behind a login that we cannot see?
     why it blocks: Deal registration and pipeline usually sit behind the partner portal, so absence of public evidence is expected rather than informative.
     where to look: Check whether a partner login exists at all; its presence implies machinery we cannot inspect.

## Retrieval health

https://lano.io/: success
https://www.lano.io/product: not_found
https://www.lano.io/products: not_found
https://www.lano.io/platform: not_found
https://www.lano.io/pricing: success
https://www.lano.io/compare: not_found
https://www.lano.io/alternatives: not_found

==============================================================================

# Foleon  (foleon.com)
Last checked 2026-08-24 · evidence coverage: moderate

## Commercial summary

Foleon describes itself as "Foleon is an enterprise content platform that makes machine-readable interactive content creation scalable, governable, and 100% on-brand". No partner programme type could be identified from the pages retrieved. It publishes a directory listing at least 82 partner organisations, described as certified. Public evidence does not establish partner platform or partner-team size.

## Machine interpretation (advisory — not a verdict)

State: research
  - A published directory lists at least 82 partner organisations, described as certified.
  - Programme prose is absent, so how the relationships work is unestablished.
  diagnostics: 0 observations → 0 distinct claims from 0 independent source(s); coverage moderate

## Category

State: likely_target_category
  Why it may matter: The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.
  Why it may not: This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.
  Unknown: Nothing about programme size, ownership or Introw need follows from category alone.
  Known-competitor list: not listed (asserted business data, separate from the inference above)
  evidence [title_tag] "Content Creation Platform - Interactive Content 100% on Brand | Foleon"  — https://www.foleon.com
  evidence [meta_description] "Foleon is an enterprise content platform that makes machine-readable interactive content creation scalable, governable, and 100% on-brand."  — https://www.foleon.com

## Constructs

### commercial_materiality: unknown
  Unknown: partner-sourced revenue share · number of active partners
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_ownership: unknown
  Unknown: who owns the programme internally · whether operation is shared with a distributor
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_surface: unknown
  Unknown: volume through each workflow · what sits behind the partner login
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)

## Partner directory

At least 82 partner organisations publicly listed, described as certified.
This is a LOWER BOUND, not a partner count. Sample: tagagency.info, sowiesodigital.nl, rostrum.agency, cubiq.co.uk, connectcommunications.co.uk, analogfolk.com, pauwerful.nl, mattercontentagency.com
Source: https://www.foleon.com/partners

## Programmes

None identified from the pages retrieved. This is not evidence that none exists.

## Systems and people

CRM: hubspot_confirmed — hubspot evidence at confirmed (hs_forms)
Partner platform: unknown
People: unknown

## What to verify next

  Q: How do these partner relationships actually work commercially?
     why it blocks: A directory lists at least 82 organisations, but no programme prose was retrieved — so whether they resell, refer, implement or merely integrate is entirely unestablished.
     where to look: The partner page behind the directory, or the terms-and-conditions page, which usually states the commercial mechanics plainly.

## Retrieval health

https://foleon.com/: success
https://www.foleon.com/product: success
https://www.foleon.com/compare: not_found
https://www.foleon.com/alternatives: not_found
https://www.foleon.com/vs: not_found

==============================================================================

# Productsup  (productsup.com)
Last checked 2026-08-24 · evidence coverage: sparse

## Commercial summary

Productsup describes itself as "Productsup’s enterprise feed management and syndication platform empowers businesses to optimize product experiences across all touchpoints. Get started today!". Public pages describe a distributor motion. Public evidence does not establish partner platform or partner-team size. Public evidence is sparse, so manual research is likely to be required — this is a limit of what the company publishes, not a judgement about it.

## Machine interpretation (advisory — not a verdict)

State: under_observed
  - No distinct partner claim was retrieved. This reflects what the company publishes, not its suitability.
  diagnostics: 0 observations → 0 distinct claims from 0 independent source(s); coverage sparse

## Category

State: likely_target_category
  Why it may matter: The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.
  Why it may not: This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.
  Unknown: Nothing about programme size, ownership or Introw need follows from category alone.
  Known-competitor list: not listed (asserted business data, separate from the inference above)
  evidence [title_tag] "Productsup: Connecting commerce, powering performance | Productsup"  — https://www.productsup.com
  evidence [meta_description] "Productsup’s enterprise feed management and syndication platform empowers businesses to optimize product experiences across all touchpoints. Get started today!"  — https://www.productsup.com

## Constructs

### commercial_materiality: strong_proxy
  Unknown: partner-sourced revenue share · number of active partners
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_ownership: unknown
  Unknown: who owns the programme internally · whether operation is shared with a distributor
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_surface: unknown
  Unknown: volume through each workflow · what sits behind the partner login
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)

## Programmes

### distributor
  · "optimize and distribute product content for… Supplier onboarding Standardize supplier data for product catalogs Learn more Retailer and distributor channels Syndicate optimized product content to retailers Learn more Marketplace channels Di"  — https://www.productsup.com/wholesalers-and-distributors/

## Systems and people

CRM: hubspot_confirmed — hubspot evidence at confirmed (hs_forms)
Partner platform: unknown
People: unknown

## What to verify next

  Q: Does this company run a partner programme at all?
     why it blocks: No partner claim was retrieved, so nothing here supports or refutes fit. Everything is blocking.
     where to look: Check the site footer and main navigation for a partner link, then search for the company name with "partner program".

## Retrieval health

https://productsup.com/: success
https://www.productsup.com/product: not_found
https://www.productsup.com/products: not_found
https://www.productsup.com/platform: success
https://www.productsup.com/compare: not_found
https://www.productsup.com/alternatives: not_found
https://www.productsup.com/vs: success

==============================================================================

# Upsales  (upsales.com)
Last checked 2026-08-24 · evidence coverage: sparse

## Commercial summary

Upsales describes itself as "Upsales CRM helps companies generate more leads, drive an effective sales process, and unlock upselling opportunities from existing clients.&#xA;&#xA". No partner programme type could be identified from the pages retrieved. Public evidence does not establish CRM, partner platform or partner-team size. Public evidence is sparse, so manual research is likely to be required — this is a limit of what the company publishes, not a judgement about it.

## Machine interpretation (advisory — not a verdict)

State: under_observed
  - No distinct partner claim was retrieved. This reflects what the company publishes, not its suitability.
  diagnostics: 0 observations → 0 distinct claims from 0 independent source(s); coverage sparse

## Category

State: likely_target_category
  Why it may matter: The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.
  Why it may not: This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.
  Unknown: Nothing about programme size, ownership or Introw need follows from category alone.
  Known-competitor list: not listed (asserted business data, separate from the inference above)
  evidence [title_tag] "Upsales | Win more deals with Upsales"  — https://www.upsales.com
  evidence [meta_description] "Upsales CRM helps companies generate more leads, drive an effective sales process, and unlock upselling opportunities from existing clients.&#xA;&#xA;"  — https://www.upsales.com

## Constructs

### commercial_materiality: unknown
  Unknown: partner-sourced revenue share · number of active partners
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_ownership: unknown
  Unknown: who owns the programme internally · whether operation is shared with a distributor
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_surface: unknown
  Unknown: volume through each workflow · what sits behind the partner login
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)

## Programmes

None identified from the pages retrieved. This is not evidence that none exists.

## Systems and people

CRM: unknown
Partner platform: unknown
People: unknown

## What to verify next

  Q: Does this company run a partner programme at all?
     why it blocks: No partner claim was retrieved, so nothing here supports or refutes fit. Everything is blocking.
     where to look: Check the site footer and main navigation for a partner link, then search for the company name with "partner program".
  Q: Does this company recruit its own partners, or has it joined someone else's programme?
     why it blocks: Participant pages read exactly like operator pages, and the evidence would belong to a different company.
     where to look: Look for a "become a partner" intake form on this domain, not a partner badge.
  Q: Which CRM does the partner team use?
     why it blocks: Introw syncs into HubSpot or Salesforce; the answer is unobservable publicly about two-thirds of the time.
     where to look: Ask on the first call. Public detection is not reliable enough to be worth more effort.

## Retrieval health

https://upsales.com/: success
https://www.upsales.com/product: success
https://www.upsales.com/compare: success

==============================================================================

# Younium  (younium.com)
Last checked 2026-08-24 · evidence coverage: moderate

## Commercial summary

Younium describes itself as "Younium is the subscription management & billing platform for running a scalable B2B subscription business". No partner programme type could be identified from the pages retrieved. Visible partner workflows include partner recruitment, co selling. The company appears to operate the programme itself. Public evidence does not establish partner platform or partner-team size.

## Machine interpretation (advisory — not a verdict)

State: research
  - Partner motion is visible but its commercial role is not established.
  diagnostics: 4 observations → 3 distinct claims from 1 independent source(s); coverage moderate

## Category

State: likely_target_category
  Why it may matter: The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.
  Why it may not: This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.
  Unknown: Nothing about programme size, ownership or Introw need follows from category alone.
  Known-competitor list: not listed (asserted business data, separate from the inference above)
  evidence [title_tag] "Younium - B2B Subscription management & billing"  — https://www.younium.com
  evidence [meta_description] "Younium is the subscription management & billing platform for running a scalable B2B subscription business."  — https://www.younium.com

## Constructs

### commercial_materiality: weak_proxy
  Why it may matter: Partners appear to take part in winning customers or revenue, which is what makes partner operations worth tooling.
  Why it may not: It does not establish how much revenue, how many partners, or whether the motion is active today.
  Unknown: partner-sourced revenue share · number of active partners
  Source quality: 1 distinct claims from 1 independent source(s)
  · "solution where finance teams already operate. Built-In Co-Sell Opportunities The marketplace acts as a co-sell engine, allowing"
      source: https://www.younium.com/partnership
      proves: the company describes partners selling or reselling its product
      does NOT prove: the volume of resale, or that resale revenue is material
### operational_ownership: direct
  Why it may matter: The company appears to run the partner motion itself, so it would be the buyer of tooling rather than a participant in someone else's.
  Why it may not: Operating a programme says nothing about its size; a competitor with an excellent programme scores identically here.
  Unknown: who owns the programme internally · whether operation is shared with a distributor
  Source quality: 1 distinct claims from 1 independent source(s)
  · "a Partner in Our Ecosystem Join forces with Younium to help B2B SaaS"
      source: https://www.younium.com/partner
      proves: the company invites organisations to join a programme it runs
      does NOT prove: that anyone joins, or that the programme is staffed
### operational_surface: moderate
  Why it may matter: Visible partner workflows suggest there is machinery that software could reduce the manual cost of.
  Why it may not: A published workflow is not a used workflow, and login-walled machinery is invisible either way.
  Unknown: volume through each workflow · what sits behind the partner login
  Source quality: 1 distinct claims from 1 independent source(s)
  · "Partner With Younium Earn as You Refer Enjoy a generous revenue share for every qualified lead or customer you bring in. Co-Market and"
      source: https://www.younium.com/partner
      proves: the company pays partners for commercial outcomes
      does NOT prove: the size of the payments or how they are calculated

## Programmes

None identified from the pages retrieved. This is not evidence that none exists.

## Systems and people

CRM: hubspot_confirmed — hubspot evidence at strong_proxy (hs_analytics)
Partner platform: unknown
People: unknown

## What to verify next

  Q: Is there partner machinery behind a login that we cannot see?
     why it blocks: Deal registration and pipeline usually sit behind the partner portal, so absence of public evidence is expected rather than informative.
     where to look: Check whether a partner login exists at all; its presence implies machinery we cannot inspect.

## Retrieval health

https://younium.com/: success
https://www.younium.com/product: success
https://www.younium.com/compare: success

==============================================================================

# Cegeka  (cegeka.com)
Last checked 2026-08-24 · evidence coverage: sparse

## Commercial summary

Cegeka describes itself as "Cegeka partners with clients to drive impactful technology solutions across industries, ensuring innovation and security through tailored services and…". No partner programme type could be identified from the pages retrieved. Public evidence does not establish partner platform or partner-team size. Public evidence is sparse, so manual research is likely to be required — this is a limit of what the company publishes, not a judgement about it.

## Machine interpretation (advisory — not a verdict)

State: under_observed
  - No distinct partner claim was retrieved. This reflects what the company publishes, not its suitability.
  diagnostics: 0 observations → 0 distinct claims from 0 independent source(s); coverage sparse

## Category

State: likely_target_category
  Why it may matter: The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.
  Why it may not: This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.
  Unknown: Nothing about programme size, ownership or Introw need follows from category alone.
  Known-competitor list: not listed (asserted business data, separate from the inference above)
  evidence [title_tag] "Cegeka | IT Solutions & Services"  — https://www.cegeka.com
  evidence [meta_description] "Cegeka partners with clients to drive impactful technology solutions across industries, ensuring innovation and security through tailored services and expertise. Discover how we can elevate your business."  — https://www.cegeka.com

## Constructs

### commercial_materiality: unknown
  Unknown: partner-sourced revenue share · number of active partners
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_ownership: unknown
  Unknown: who owns the programme internally · whether operation is shared with a distributor
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_surface: unknown
  Unknown: volume through each workflow · what sits behind the partner login
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)

## Programmes

None identified from the pages retrieved. This is not evidence that none exists.

## Systems and people

CRM: hubspot_confirmed — hubspot evidence at confirmed (hs_forms)
Partner platform: unknown
People: unknown

## What to verify next

  Q: Does this company run a partner programme at all?
     why it blocks: No partner claim was retrieved, so nothing here supports or refutes fit. Everything is blocking.
     where to look: Check the site footer and main navigation for a partner link, then search for the company name with "partner program".

## Retrieval health

https://cegeka.com/: success
https://www.cegeka.com/product: not_found
https://www.cegeka.com/products: not_found
https://www.cegeka.com/platform: not_found
https://www.cegeka.com/pricing: not_found
https://www.cegeka.com/what-we-do: not_found
https://www.cegeka.com/solutions: success

==============================================================================

# Vinted  (vinted.com)
Last checked 2026-08-24 · evidence coverage: sparse

## Commercial summary

Vinted describes itself as "One community, thousands of brands, and a whole lot of second-hand style. Ready to get started? Here’s how it works". No partner programme type could be identified from the pages retrieved. Public evidence does not establish CRM, partner platform or partner-team size. Public evidence is sparse, so manual research is likely to be required — this is a limit of what the company publishes, not a judgement about it.

## Machine interpretation (advisory — not a verdict)

State: under_observed
  - No distinct partner claim was retrieved. This reflects what the company publishes, not its suitability.
  diagnostics: 0 observations → 0 distinct claims from 0 independent source(s); coverage sparse

## Category

State: likely_target_category
  Why it may matter: The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.
  Why it may not: This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.
  Unknown: Nothing about programme size, ownership or Introw need follows from category alone.
  Known-competitor list: not listed (asserted business data, separate from the inference above)
  evidence [title_tag] "Vinted | Sell and buy clothes, shoes and accessories"  — https://www.vinted.com
  evidence [meta_description] "One community, thousands of brands, and a whole lot of second-hand style. Ready to get started? Here’s how it works."  — https://www.vinted.com

## Constructs

### commercial_materiality: unknown
  Unknown: partner-sourced revenue share · number of active partners
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_ownership: unknown
  Unknown: who owns the programme internally · whether operation is shared with a distributor
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)
### operational_surface: unknown
  Unknown: volume through each workflow · what sits behind the partner login
  Source quality: 0 distinct claims from 0 independent source(s)
  (no evidence collected for this construct)

## Programmes

None identified from the pages retrieved. This is not evidence that none exists.

## Systems and people

CRM: unknown
Partner platform: unknown
People: unknown

## What to verify next

  Q: Does this company run a partner programme at all?
     why it blocks: No partner claim was retrieved, so nothing here supports or refutes fit. Everything is blocking.
     where to look: Check the site footer and main navigation for a partner link, then search for the company name with "partner program".
  Q: Does this company recruit its own partners, or has it joined someone else's programme?
     why it blocks: Participant pages read exactly like operator pages, and the evidence would belong to a different company.
     where to look: Look for a "become a partner" intake form on this domain, not a partner badge.
  Q: Which CRM does the partner team use?
     why it blocks: Introw syncs into HubSpot or Salesforce; the answer is unobservable publicly about two-thirds of the time.
     where to look: Ask on the first call. Public detection is not reliable enough to be worth more effort.

## Retrieval health

https://vinted.com/: success
https://www.vinted.com/product: not_found
https://www.vinted.com/products: not_found
https://www.vinted.com/platform: not_found
https://www.vinted.com/pricing: not_found
https://www.vinted.com/what-we-do: not_found
https://www.vinted.com/solutions: not_found