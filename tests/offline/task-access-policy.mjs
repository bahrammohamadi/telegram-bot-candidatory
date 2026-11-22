// Offline, dependency-free authorization contract. NOT wired into production handlers.
// The adapter must derive principal and memberships server-side, never from client payloads.
export function canAccessTask({principal, membership, task, action}) {
  if (!principal || !membership || !task) return false;
  if (principal.id == null || membership.userId == null) return false;
  if (String(principal.id) !== String(membership.userId)) return false;
  if (membership.active !== true) return false;
  if (membership.workspaceId == null || task.workspaceId == null) return false;
  if (String(membership.workspaceId) !== String(task.workspaceId)) return false;
  if (action === 'read') return ['viewer','member','manager','admin'].includes(membership.role);
  if (action === 'write') return ['manager','admin'].includes(membership.role) ||
    (membership.role === 'member' && task.ownerId != null && String(task.ownerId) === String(principal.id));
  return false;
}
