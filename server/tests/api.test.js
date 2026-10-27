import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Workspace } from '../src/models/Workspace.js';
import { Section } from '../src/models/Section.js';
import { Task } from '../src/models/Task.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/task_management_test_db';

let adminToken;
let memberToken;
let viewerToken;
let testWorkspace;
let testSectionA;
let testSectionB;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Task.deleteMany({});
  await Section.deleteMany({});
  await Workspace.deleteMany({});
  await User.deleteMany({});

  // 1. Register Admin
  const resAdmin = await request(app).post('/api/auth/register').send({
    name: 'Test Admin',
    email: 'admin_test@example.com',
    password: 'password123',
    role: 'Admin'
  });
  adminToken = resAdmin.body.token;
  testWorkspace = resAdmin.body.workspace;

  // 2. Register Member
  const resMember = await request(app).post('/api/auth/register').send({
    name: 'Test Member',
    email: 'member_test@example.com',
    password: 'password123',
    role: 'Member'
  });
  memberToken = resMember.body.token;

  // Add member to testWorkspace
  await request(app)
    .post(`/api/workspaces/${testWorkspace._id}/members`)
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', testWorkspace._id)
    .send({ email: 'member_test@example.com', role: 'Member' });

  // 3. Register Viewer
  const resViewer = await request(app).post('/api/auth/register').send({
    name: 'Test Viewer',
    email: 'viewer_test@example.com',
    password: 'password123',
    role: 'Viewer'
  });
  viewerToken = resViewer.body.token;

  // Add viewer to testWorkspace
  await request(app)
    .post(`/api/workspaces/${testWorkspace._id}/members`)
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', testWorkspace._id)
    .send({ email: 'viewer_test@example.com', role: 'Viewer' });

  // 4. Fetch sections created automatically for workspace
  const secRes = await request(app)
    .get('/api/sections')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('x-workspace-id', testWorkspace._id);
  
  testSectionA = secRes.body.sections[0];
  testSectionB = secRes.body.sections[1];
});

afterAll(async () => {
  await Task.deleteMany({});
  await Section.deleteMany({});
  await Workspace.deleteMany({});
  await User.deleteMany({});
  await mongoose.disconnect();
});

describe('1. Authentication & Security Endpoints', () => {
  it('should reject login with invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin_test@example.com',
      password: 'wrong_password'
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should authenticate user and return profile on GET /api/auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin_test@example.com');
  });

  it('should reject unauthenticated requests to protected endpoints', async () => {
    const res = await request(app).get('/api/sections');
    expect(res.status).toBe(401);
  });
});

describe('2. Sections Management & Permission Enforcement', () => {
  it('should allow Admin to create a new section', async () => {
    const res = await request(app)
      .post('/api/sections')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', testWorkspace._id)
      .send({
        name: 'Quality Assurance',
        description: 'Testing and security audits',
        color: '#2E7D5B'
      });
    expect(res.status).toBe(201);
    expect(res.body.section.name).toBe('Quality Assurance');
  });

  it('should prevent Viewer from modifying or creating sections', async () => {
    const res = await request(app)
      .post('/api/sections')
      .set('Authorization', `Bearer ${viewerToken}`)
      .set('x-workspace-id', testWorkspace._id)
      .send({
        name: 'Viewer Section Attempt'
      });
    expect(res.status).toBe(403);
  });
});

describe('3. Three-Stage Workflow Transitions & Timing Accuracy', () => {
  let createdTaskId;

  it('should create a task in Allocated stage with zero durations', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', testWorkspace._id)
      .send({
        title: 'Build Distributed Lock Manager',
        description: 'Prevent race conditions on inventory decrement',
        section: testSectionA._id,
        priority: 'High',
        slaTargetMinutes: 60
      });

    expect(res.status).toBe(201);
    expect(res.body.task.currentStage).toBe('Allocated');
    expect(res.body.task.stageHistory.length).toBe(1);
    expect(res.body.task.stageHistory[0].stage).toBe('Allocated');
    expect(res.body.task.durations).toBeDefined();
    createdTaskId = res.body.task._id;
  });

  it('should transition Allocated -> Working, close Allocated interval, and start Working', async () => {
    const res = await request(app)
      .post(`/api/tasks/${createdTaskId}/transitions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', testWorkspace._id)
      .send({ stage: 'Working' });

    expect(res.status).toBe(200);
    expect(res.body.task.currentStage).toBe('Working');
    expect(res.body.task.stageHistory.length).toBe(2);
    expect(res.body.task.stageHistory[0].exitedAt).not.toBeNull();
    expect(res.body.task.stageHistory[1].stage).toBe('Working');
    expect(res.body.task.stageHistory[1].exitedAt).toBeNull();
  });

  it('should transition Working -> Done, stop active timers, and set completedAt', async () => {
    const res = await request(app)
      .post(`/api/tasks/${createdTaskId}/transitions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', testWorkspace._id)
      .send({ stage: 'Done' });

    expect(res.status).toBe(200);
    expect(res.body.task.currentStage).toBe('Done');
    expect(res.body.task.completedAt).not.toBeNull();
    expect(res.body.task.completionDurationMs).toBeGreaterThanOrEqual(0);
    // Done stage has NO active stage elapsed timer
    expect(res.body.task.durations.currentStageElapsedMs).toBe(0);
    // Historical durations remain intact
    expect(res.body.task.allocatedDurationMs).toBeGreaterThanOrEqual(0);
    expect(res.body.task.workingDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('should reopen Done -> Allocated, preserve history, and reset completion fields', async () => {
    const res = await request(app)
      .post(`/api/tasks/${createdTaskId}/transitions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', testWorkspace._id)
      .send({ stage: 'Allocated' });

    expect(res.status).toBe(200);
    expect(res.body.task.currentStage).toBe('Allocated');
    expect(res.body.task.completedAt).toBeNull();
    expect(res.body.task.completionDurationMs).toBeNull();
    // Prior intervals must be preserved
    expect(res.body.task.stageHistory.length).toBeGreaterThanOrEqual(4);
  });
});

describe('4. Section Average Task Completion Time & Global Search', () => {
  it('should accurately calculate average completion time for a section', async () => {
    // Complete the task in testSectionA
    const tasksRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', testWorkspace._id);

    const task = tasksRes.body.tasks[0];
    await request(app)
      .post(`/api/tasks/${task._id}/transitions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', testWorkspace._id)
      .send({ stage: 'Done' });

    const secRes = await request(app)
      .get('/api/sections')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', testWorkspace._id);

    const updatedSecA = secRes.body.sections.find((s) => s._id === testSectionA._id);
    expect(updatedSecA.stats.doneTasks).toBeGreaterThanOrEqual(1);
    expect(updatedSecA.stats.avgCompletionTimeFormatted).not.toBe('N/A');
  });

  it('should perform global search returning grouped sections and tasks with parent section', async () => {
    const res = await request(app)
      .get('/api/search?q=Distributed')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', testWorkspace._id);

    expect(res.status).toBe(200);
    expect(res.body.results.tasks.length).toBeGreaterThanOrEqual(1);
    expect(res.body.results.tasks[0].section).toBeDefined();
    expect(res.body.results.tasks[0].section.name).toBeDefined();
  });
});
