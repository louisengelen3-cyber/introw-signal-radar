import { describe, expect, it } from 'vitest';
import { assessCrm } from '../src/evidence/crm.js';

describe('assessCrm', () => {
  it('confirms HubSpot from a portal-scoped tracking script', () => {
    const a = assessCrm(['<script src="//js.hs-scripts.com/1234567.js"></script>']);
    expect(a.vendor).toBe('hubspot');
    expect(a.state).toBe('confirmed');
    expect(a.compatibility).toBe('compatible_confirmed');
  });

  it('confirms Salesforce from a Web-to-Lead endpoint', () => {
    const a = assessCrm(['<form action="https://webto.salesforce.com/servlet/servlet.WebToLead">']);
    expect(a.vendor).toBe('salesforce');
    expect(a.compatibility).toBe('compatible_confirmed');
  });

  it('treats absence as unknown, never as "no CRM"', () => {
    const a = assessCrm(['<html><body>we sell software</body></html>']);
    expect(a.vendor).toBeNull();
    expect(a.state).toBe('unknown');
    expect(a.compatibility).toBe('unknown');
    expect(a.rationale).toMatch(/not evidence/i);
  });

  it('never reports an unsupported CRM as incompatible', () => {
    // Dual-CRM estates are common, and a Pipedrive form says nothing about the
    // system of record. The mandate forbids reading absence as exclusion.
    const a = assessCrm(['<form action="https://webforms.pipedrive.com/x">']);
    expect(a.vendor).toBe('pipedrive');
    expect(a.compatibility).toBe('unknown');
    expect(JSON.stringify(a)).not.toMatch(/incompatible/);
  });

  it('prefers a supported CRM when both are present', () => {
    const a = assessCrm(['<script src="//js.hs-scripts.com/7654321.js"></script>', '<form action="https://webforms.pipedrive.com/x">']);
    expect(a.vendor).toBe('hubspot');
    expect(a.compatibility).toBe('compatible_confirmed');
  });

  it('does not treat a HubSpot CDN asset as CRM confirmation', () => {
    const a = assessCrm(['<img src="https://cdn2.hubspot.net/logo.png">']);
    expect(a.state).toBe('strong_proxy');
    expect(a.compatibility).toBe('compatible_proxy');
    expect(a.observations[0].doesNotProve).toMatch(/CMS is bought without Sales Hub/);
  });

  it('ignores prose mentions — only artifacts count', () => {
    const a = assessCrm(['<p>We love HubSpot and Salesforce here at Acme.</p>']);
    expect(a.vendor).toBeNull();
  });
});
