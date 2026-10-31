/**
 * Firestore Security Rules Test Suite (Dirty Dozen Verification)
 * Verifies that all 12 adversarial payloads defined in security_spec.md
 * return PERMISSION_DENIED against firestore.rules.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: {
    uid: string;
    email: string;
    email_verified: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Profile Create',
    operation: 'create',
    path: '/users/user_A',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      uid: 'user_B',
      displayName: 'Alex Morgan',
      workspaceName: 'Northstar Studio',
      activePlan: 'Pro',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on Profile Create',
    operation: 'create',
    path: '/users/user_A',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      uid: 'user_A',
      displayName: 'Alex Morgan',
      workspaceName: 'Northstar Studio',
      activePlan: 'Pro',
      isAdmin: true,
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Email Write',
    operation: 'create',
    path: '/users/user_A',
    auth: { uid: 'user_A', email: 'findifyai@gmail.com', email_verified: false },
    payload: {
      uid: 'user_A',
      displayName: 'Alex Morgan',
      workspaceName: 'Northstar Studio',
      activePlan: 'Pro',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Cross-User Profile Read',
    operation: 'get',
    path: '/users/user_A',
    auth: { uid: 'user_B', email: 'b@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Immortal Field Mutation (createdAt)',
    operation: 'update',
    path: '/users/user_A',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      uid: 'user_A',
      displayName: 'Alex Updated',
      workspaceName: 'Northstar Studio',
      activePlan: 'Pro',
      createdAt: 'FORGED_NEW_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Forged Client Timestamp on Create',
    operation: 'create',
    path: '/users/user_A',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      uid: 'user_A',
      displayName: 'Alex Morgan',
      workspaceName: 'Northstar Studio',
      activePlan: 'Pro',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Orphaned Task Creation Without Parent Profile',
    operation: 'create',
    path: '/users/nonexistent_user/tasks/task_1',
    auth: {
      uid: 'nonexistent_user',
      email: 'a@example.com',
      email_verified: true,
    },
    payload: {
      id: 'task_1',
      ownerId: 'nonexistent_user',
      title: 'Test Task',
      project: 'General',
      priority: 'High',
      status: 'today',
      due: 'Today',
      assignee: 'Alex',
      notes: '',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Value Poisoning on Task Update (Oversized String)',
    operation: 'update',
    path: '/users/user_A/tasks/task_1',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      title: 'X'.repeat(500),
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Invalid Enum State Shortcutting',
    operation: 'create',
    path: '/users/user_A/tasks/task_1',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'task_1',
      ownerId: 'user_A',
      title: 'Valid title',
      project: 'General',
      priority: 'SUPER_URGENT',
      status: 'today',
      due: 'Today',
      assignee: 'Alex',
      notes: '',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Terminal State Mutation on Completed Task',
    operation: 'update',
    path: '/users/user_A/tasks/completed_task_1',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      title: 'Mutating completed task',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'ID Poisoning Attack',
    operation: 'create',
    path: '/users/user_A/tasks/bad$id!with spaces',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'bad$id!with spaces',
      ownerId: 'user_A',
      title: 'Valid title',
      project: 'General',
      priority: 'High',
      status: 'today',
      due: 'Today',
      assignee: 'Alex',
      notes: '',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unauthorized List Scraping Across Users',
    operation: 'list',
    path: '/users/user_A/tasks',
    auth: { uid: 'user_B', email: 'b@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];
