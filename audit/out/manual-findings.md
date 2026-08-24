# Manual false-negative audit — working notes

## Quatt (quatt.io) — NOT a failure, but revealing
`suppression_candidate` is **correct**: `partners.quatt.io → cm0kv0bpq005ifmvbxfjz43u3.cname.introw.io`.
Quatt is an existing Introw customer and the rule caught it.

But note *how* it was caught. The Radar established Quatt's partner motion **only** from the
Introw DNS fingerprint. Its content yielded `claims=0, coverage=none`:
- `/partners` is a **product page** ("Ontdek alle producten … hybride warmtepomp")
- `/zakelijk` says *"Wij werken samen met **installatiepartners**, woningcorporaties…"*

`installatiepartners` is not in the lexicon. Without the CNAME, Introw's own flagship
manufacturing case study — 10 to 200 partners in a year — would have read as under-observed.
**Classification: VOCABULARY + LOCALE.**

## Vaillant (vaillant.com) — DISCOVERY / ENTITY RESOLUTION
The Radar reports `reachable: false, pages: 0`. Diagnosis:
- `https://www.vaillant.com/` → **fetch failed, status 0** (not bot protection)
- `https://www.vaillant.co.uk/` → **200, 536 KB**
- `https://professional.vaillant.co.uk/` → **200**

The channel programme is real and substantial — **Vaillant Advance**, four installer tiers up
to Advanced MasterTEC, product registration, a partner portal (myVaillant Pro / myREWARDS),
cash-and-points rewards, and *"top tier installers able to benefit from access to sales leads"*.
That is lead routing, tiering, registration and enablement — exactly Introw's stated
manufacturing motion.

None of it sits on the apex domain. It lives on a **country domain and a professional
subdomain**, and much of the detail is in **PDFs**.
**Classification: ENTITY RESOLUTION (multi-domain) + SOURCE (subdomain/PDF) + VOCABULARY.**

## Fronius (fronius.com) — VOCABULARY / SOURCE
Three tiers — Service Authorized Installer → Fronius Trained Installer → Fronius Solutions
Partner — across **5,000+ installers**, with annual criteria to retain tier, an E-Academy,
spare-parts ordering, and partners *"empowered with exclusive service work, **customer leads**,
… marketing and sales tools"*.

Lead routing, tiering, certification, enablement. The word "partner" appears, but the
programme lives under `/solar-energy/installers-partners/…`, a path the Radar does not probe.
