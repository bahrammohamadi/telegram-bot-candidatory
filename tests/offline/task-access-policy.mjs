// Offline, dependency-free authorization contract. NOT wired into production handlers.
// The adapter must derive principal and memberships server-side, never from client payloads.
// Reject empty, non-scalar and non-finite IDs rather than comparing their string coercions.
const validId = (value) =>
  (typeof value === 'string' && value.trim().length > 0) ||
  (typeof value === 'number' && Number.isFinite(value));

export function canAccessTask({principal, membership, task, action}) {
  if (!principal || !membership || !task) return false;
  if (!validId(principal.id) || !validId(membership.userId)) return false;
  if (String(principal.id) !== String(membership.userId)) return false;
  if (membership.active !== true) return false;
  if (!validId(membership.workspaceId) || !validId(task.workspaceId)) return false;
  if (String(membership.workspaceId) !== String(task.workspaceId)) return false;
  if (action === 'read') return ['viewer','member','manager','admin'].includes(membership.role);
  if (action === 'write') return ['manager','admin'].includes(membership.role) ||
    (membership.role === 'member' && validId(task.ownerId) && String(task.ownerId) === String(principal.id));
  return false;
}
