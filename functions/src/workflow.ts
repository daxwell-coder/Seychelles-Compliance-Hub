export type Status = 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'ESCALATED' | 'CLOSED';
export function validateTransition(from: Status, to: Status): boolean {
  const allowed: Record<Status, Status[]> = {
    OPEN: ['IN_PROGRESS', 'ESCALATED', 'CLOSED'],
    IN_PROGRESS: ['REVIEW', 'CLOSED'],
    REVIEW: ['IN_PROGRESS', 'CLOSED'],
    ESCALATED: ['IN_PROGRESS', 'CLOSED'],
    CLOSED: []
  };
  return allowed[from].includes(to);
}
