import { validateTransition } from './workflow';

test('validateTransition basic paths', () => {
  expect(validateTransition('OPEN' as any, 'IN_PROGRESS' as any)).toBe(true);
  expect(validateTransition('OPEN' as any, 'ESCALATED' as any)).toBe(true);
  expect(validateTransition('ESCALATED' as any, 'IN_PROGRESS' as any)).toBe(true);
  expect(validateTransition('IN_PROGRESS' as any, 'REVIEW' as any)).toBe(true);
  expect(validateTransition('REVIEW' as any, 'CLOSED' as any)).toBe(true);
  expect(validateTransition('CLOSED' as any, 'OPEN' as any)).toBe(false);
});
