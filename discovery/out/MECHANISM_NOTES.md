# Discovery mechanism notes

## PRM tenancy inversion — DOES NOT WORK AS DISCOVERY

**Hypothesis:** a company whose partner portal is served by a PRM vendor definitionally
operates a partner programme, so enumerating PRM tenants would be a very-high-precision
discovery mechanism.

**Result: 0 candidates from 8 PRM vendors.**

**Why.** Certificate transparency is indexed by the domain *in the certificate*. A tenant's
portal certificate is issued for `partners.customer.com`, not for the vendor's domain, so
querying `impartner.com` returns only Impartner's own 35 subdomains
(`status.`, `resources.`, `prtg.`, `design.`…). Finding tenants would require reverse-CNAME
lookup — "which hosts point at `cname.introw.io`" — which no free passive-DNS source exposes.

**Status.** The CNAME fingerprint remains excellent as *verification* on a known domain, which
is how production already uses it. It is not available as a discovery mechanism without a paid
passive-DNS provider. Reported rather than quietly dropped.
