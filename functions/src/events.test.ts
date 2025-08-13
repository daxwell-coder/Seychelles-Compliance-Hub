import { validateEventPayload } from './eventRegistry';
// Manual Jest global declarations for this environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const describe: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const it: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const expect: any;

// Minimal in-memory registry injection is indirect; we rely on real file load.
// To ensure required file is present, this test only asserts behavior for known schemas.

describe('validateEventPayload', () => {
  it('passes with all required fields for onboarding.completed', () => {
    const res = validateEventPayload('onboarding.completed', { clientId: 'abc123', clientName: 'Test Co', beneficialOwnerCount: 2 });
    expect(res.ok).toBe(true);
    expect(res.missing).toHaveLength(0);
    expect(res.extraneous).toHaveLength(0);
  });

  it('fails with missing required field', () => {
    const res = validateEventPayload('onboarding.completed', { owners: 2 });
    expect(res.ok).toBe(false);
    expect(res.missing).toContain('clientId');
  });

  it('flags extraneous field', () => {
    const res = validateEventPayload('onboarding.completed', { clientId: 'abc123', owners: 1, extra: true });
    expect(res.ok).toBe(false);
    expect(res.extraneous).toContain('extra');
  });

  it('returns not ok for unknown event type', () => {
    const res = validateEventPayload('unknown.event', { anything: true });
    expect(res.ok).toBe(false);
    expect(res.schema).toBeUndefined();
  });
});
