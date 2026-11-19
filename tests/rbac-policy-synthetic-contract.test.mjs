// Synthetic RBAC policy contract. No network, credentials, D1, or production calls.
// This is a specification test, NOT proof that deployed handlers enforce it.
import test from 'node:test';
import assert from 'node:assert/strict';

const permissions = Object.freeze({
  guest: new Set(['public:read']),
  candidate: new Set(['public:read','case:read:self','case:update:self','task:read:self','task:update:self']),
  reviewer: new Set(['public:read','case:read:assigned','task:read:assigned']),
  admin: new Set(['public:read','case:read:assigned','task:read:assigned','case:read:all']),
});
function authorize({role,action,ownerId,actorId,assignedReviewerId}) {
  const grants = permissions[role];
  if (!grants || !grants.has(action)) return false;
  if (action.endsWith(':self')) return Boolean(actorId && ownerId && actorId === ownerId);
  if (action.endsWith(':assigned')) return Boolean(actorId && assignedReviewerId && actorId === assignedReviewerId);
  return true;
}
const cases = [
 ['candidate owns case', {role:'candidate',action:'case:read:self',actorId:'u1',ownerId:'u1'},true],
 ['candidate cannot read other case', {role:'candidate',action:'case:read:self',actorId:'u1',ownerId:'u2'},false],
 ['candidate cannot change other task', {role:'candidate',action:'task:update:self',actorId:'u1',ownerId:'u2'},false],
 ['reviewer assigned case', {role:'reviewer',action:'case:read:assigned',actorId:'r1',assignedReviewerId:'r1'},true],
 ['reviewer cannot read unassigned case', {role:'reviewer',action:'case:read:assigned',actorId:'r1',assignedReviewerId:'r2'},false],
 ['reviewer cannot modify candidate task', {role:'reviewer',action:'task:update:self',actorId:'r1',ownerId:'r1'},false],
 ['guest cannot read case', {role:'guest',action:'case:read:self',actorId:'u1',ownerId:'u1'},false],
 ['unknown role fails closed', {role:'superuser',action:'case:read:all'},false],
 ['missing actor fails closed', {role:'candidate',action:'case:read:self',ownerId:'u1'},false],
 ['admin read all cases', {role:'admin',action:'case:read:all'},true],
 ['candidate cannot consume AI', {role:'candidate',action:'ai:invoke'},false],
 ['admin cannot change roles implicitly', {role:'admin',action:'roles:write'},false],
];
for (const [name,input,expected] of cases) test(name,()=>assert.equal(authorize(input),expected));
