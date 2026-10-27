import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Section } from '../models/Section.js';
import { Task } from '../models/Task.js';

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task_management_db';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB');

    // Clean existing test data
    await Task.deleteMany({});
    await Section.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});

    console.log('[Seed] Cleared old data');

    // 1. Create Users
    const admin = await User.create({
      name: 'Sarah Connor',
      email: 'admin@example.com',
      password: 'password123',
      role: 'Admin'
    });

    const member = await User.create({
      name: 'Alex Murphy',
      email: 'member@example.com',
      password: 'password123',
      role: 'Member'
    });

    const viewer = await User.create({
      name: 'Dana Scully',
      email: 'viewer@example.com',
      password: 'password123',
      role: 'Viewer'
    });

    console.log('[Seed] Users created: admin@example.com, member@example.com, viewer@example.com (pw: password123)');

    // 2. Create Workspace
    const workspace = await Workspace.create({
      name: 'Acme Product Engineering',
      description: 'Core product development and reliability operations workspace',
      owner: admin._id,
      members: [
        { user: admin._id, role: 'Admin' },
        { user: member._id, role: 'Member' },
        { user: viewer._id, role: 'Viewer' }
      ],
      defaultSlaMinutes: 180 // 3 hours
    });

    admin.currentWorkspace = workspace._id;
    await admin.save();
    member.currentWorkspace = workspace._id;
    await member.save();
    viewer.currentWorkspace = workspace._id;
    await viewer.save();

    // 3. Create Sections
    const backlog = await Section.create({
      name: 'Backlog',
      description: 'Candidate features and backlog items pending triage',
      workspace: workspace._id,
      order: 0,
      color: '#8B6548',
      creator: admin._id
    });

    const development = await Section.create({
      name: 'Development',
      description: 'Active coding, system architecture, and API integration',
      workspace: workspace._id,
      order: 1,
      color: '#3977C3',
      creator: admin._id
    });

    const testing = await Section.create({
      name: 'Review & Testing',
      description: 'Automated test verification, performance benchmarking, and QA',
      workspace: workspace._id,
      order: 2,
      color: '#2E7D5B',
      creator: admin._id
    });

    const deployment = await Section.create({
      name: 'Deployment',
      description: 'Production containerization, release gates, and infrastructure monitoring',
      workspace: workspace._id,
      order: 3,
      color: '#24312B',
      creator: admin._id
    });

    console.log('[Seed] Sections created');

    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    const twoHours = 2 * oneHour;
    const fourHours = 4 * oneHour;

    // 4. Create Tasks demonstrating 3-stage lifecycle, SLA compliance, and realistic timing
    const tasks = [
      // Task 1: Completed within SLA (Attributed to Deployment)
      {
        title: 'Configure Production MongoDB Atlas Connection',
        description: 'Set up resilient connection pool, SSL certs, and replica set failover',
        workspace: workspace._id,
        section: deployment._id,
        completionSection: deployment._id,
        creator: admin._id,
        assignee: admin._id,
        priority: 'High',
        currentStage: 'Done',
        workflowStartedAt: new Date(now.getTime() - 5 * oneHour),
        stageEnteredAt: new Date(now.getTime() - 2 * oneHour),
        completedAt: new Date(now.getTime() - 2 * oneHour),
        allocatedDurationMs: 1.5 * oneHour,
        workingDurationMs: 1.5 * oneHour,
        completionDurationMs: 3.0 * oneHour,
        slaTargetMinutes: 240, // 4 hours target
        slaStartedAt: new Date(now.getTime() - 5 * oneHour),
        slaDeadline: new Date(now.getTime() - 1 * oneHour),
        slaMet: true, // Completed 2 hours ago, deadline was 1 hour ago -> Met!
        tags: ['Database', 'Production', 'Security'],
        stageHistory: [
          {
            stage: 'Allocated',
            enteredAt: new Date(now.getTime() - 5 * oneHour),
            exitedAt: new Date(now.getTime() - 3.5 * oneHour),
            durationMs: 1.5 * oneHour,
            transitionedBy: admin._id
          },
          {
            stage: 'Working',
            enteredAt: new Date(now.getTime() - 3.5 * oneHour),
            exitedAt: new Date(now.getTime() - 2 * oneHour),
            durationMs: 1.5 * oneHour,
            transitionedBy: admin._id
          },
          {
            stage: 'Done',
            enteredAt: new Date(now.getTime() - 2 * oneHour),
            exitedAt: new Date(now.getTime() - 2 * oneHour),
            durationMs: 0,
            transitionedBy: admin._id
          }
        ]
      },

      // Task 2: Completed with SLA Breach (Attributed to Review & Testing)
      {
        title: 'End-to-End Cypress Integration Suite',
        description: 'Automate checkout and cart flows for regression detection',
        workspace: workspace._id,
        section: testing._id,
        completionSection: testing._id,
        creator: admin._id,
        assignee: member._id,
        priority: 'Medium',
        currentStage: 'Done',
        workflowStartedAt: new Date(now.getTime() - 8 * oneHour),
        stageEnteredAt: new Date(now.getTime() - 1 * oneHour),
        completedAt: new Date(now.getTime() - 1 * oneHour),
        allocatedDurationMs: 2 * oneHour,
        workingDurationMs: 5 * oneHour,
        completionDurationMs: 7 * oneHour,
        slaTargetMinutes: 180, // 3 hours target
        slaStartedAt: new Date(now.getTime() - 8 * oneHour),
        slaDeadline: new Date(now.getTime() - 5 * oneHour),
        slaMet: false, // Finished 1 hour ago, deadline was 5 hours ago -> Breached!
        tags: ['Testing', 'QA', 'Automation'],
        stageHistory: [
          {
            stage: 'Allocated',
            enteredAt: new Date(now.getTime() - 8 * oneHour),
            exitedAt: new Date(now.getTime() - 6 * oneHour),
            durationMs: 2 * oneHour,
            transitionedBy: admin._id
          },
          {
            stage: 'Working',
            enteredAt: new Date(now.getTime() - 6 * oneHour),
            exitedAt: new Date(now.getTime() - 1 * oneHour),
            durationMs: 5 * oneHour,
            transitionedBy: member._id
          },
          {
            stage: 'Done',
            enteredAt: new Date(now.getTime() - 1 * oneHour),
            exitedAt: new Date(now.getTime() - 1 * oneHour),
            durationMs: 0,
            transitionedBy: member._id
          }
        ]
      },

      // Task 3: Currently Working (In Progress, within SLA)
      {
        title: 'Implement JWT Authentication & Refresh Flow',
        description: 'Secure cookies, role verification middleware, and token blacklist logic',
        workspace: workspace._id,
        section: development._id,
        creator: admin._id,
        assignee: member._id,
        priority: 'Critical',
        currentStage: 'Working',
        workflowStartedAt: new Date(now.getTime() - 90 * 60 * 1000), // 90 mins ago
        stageEnteredAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 mins ago
        allocatedDurationMs: 45 * 60 * 1000,
        workingDurationMs: 0, // Ongoing in working
        slaTargetMinutes: 240, // 4 hours
        slaStartedAt: new Date(now.getTime() - 90 * 60 * 1000),
        slaDeadline: new Date(now.getTime() + 150 * 60 * 1000), // 2.5h remaining
        tags: ['Auth', 'Security', 'Backend'],
        stageHistory: [
          {
            stage: 'Allocated',
            enteredAt: new Date(now.getTime() - 90 * 60 * 1000),
            exitedAt: new Date(now.getTime() - 45 * 60 * 1000),
            durationMs: 45 * 60 * 1000,
            transitionedBy: admin._id
          },
          {
            stage: 'Working',
            enteredAt: new Date(now.getTime() - 45 * 60 * 1000),
            exitedAt: null,
            durationMs: 0,
            transitionedBy: member._id
          }
        ]
      },

      // Task 4: Currently Allocated (Approaching SLA Deadline)
      {
        title: 'Optimize Section Aggregation MongoDB Queries',
        description: 'Index compound keys and benchmark sub-10ms response times for section stats',
        workspace: workspace._id,
        section: development._id,
        creator: admin._id,
        assignee: null,
        priority: 'High',
        currentStage: 'Allocated',
        workflowStartedAt: new Date(now.getTime() - 100 * 60 * 1000),
        stageEnteredAt: new Date(now.getTime() - 100 * 60 * 1000),
        allocatedDurationMs: 0,
        workingDurationMs: 0,
        slaTargetMinutes: 120, // 2 hours
        slaStartedAt: new Date(now.getTime() - 100 * 60 * 1000),
        slaDeadline: new Date(now.getTime() + 20 * 60 * 1000), // only 20 mins remaining -> Approaching!
        tags: ['Database', 'Optimization', 'Performance'],
        stageHistory: [
          {
            stage: 'Allocated',
            enteredAt: new Date(now.getTime() - 100 * 60 * 1000),
            exitedAt: null,
            durationMs: 0,
            transitionedBy: admin._id
          }
        ]
      },

      // Task 5: Ongoing Overdue (SLA Breached)
      {
        title: 'Resolve Redis Cache Invalidation on Task Update',
        description: 'Ensure cache eviction triggers when stage changes occur',
        workspace: workspace._id,
        section: backlog._id,
        creator: admin._id,
        assignee: admin._id,
        priority: 'Medium',
        currentStage: 'Allocated',
        workflowStartedAt: new Date(now.getTime() - 5 * oneHour),
        stageEnteredAt: new Date(now.getTime() - 5 * oneHour),
        allocatedDurationMs: 0,
        workingDurationMs: 0,
        slaTargetMinutes: 120, // 2 hours target, started 5 hours ago -> Overdue!
        slaStartedAt: new Date(now.getTime() - 5 * oneHour),
        slaDeadline: new Date(now.getTime() - 3 * oneHour),
        tags: ['Bug', 'Cache'],
        stageHistory: [
          {
            stage: 'Allocated',
            enteredAt: new Date(now.getTime() - 5 * oneHour),
            exitedAt: null,
            durationMs: 0,
            transitionedBy: admin._id
          }
        ]
      },

      // Task 6: Completed task in Development
      {
        title: 'Design Three-Stage State Machine Logic',
        description: 'Document transition matrix and closed interval calculation algorithm',
        workspace: workspace._id,
        section: development._id,
        completionSection: development._id,
        creator: admin._id,
        assignee: member._id,
        priority: 'Critical',
        currentStage: 'Done',
        workflowStartedAt: new Date(now.getTime() - 6 * oneHour),
        stageEnteredAt: new Date(now.getTime() - 4 * oneHour),
        completedAt: new Date(now.getTime() - 4 * oneHour),
        allocatedDurationMs: 1 * oneHour,
        workingDurationMs: 1 * oneHour,
        completionDurationMs: 2 * oneHour,
        slaTargetMinutes: 180, // 3 hours
        slaStartedAt: new Date(now.getTime() - 6 * oneHour),
        slaDeadline: new Date(now.getTime() - 3 * oneHour),
        slaMet: true, // Completed in 2 hours, well within 3 hours target
        tags: ['Architecture', 'State Machine'],
        stageHistory: [
          {
            stage: 'Allocated',
            enteredAt: new Date(now.getTime() - 6 * oneHour),
            exitedAt: new Date(now.getTime() - 5 * oneHour),
            durationMs: 1 * oneHour,
            transitionedBy: admin._id
          },
          {
            stage: 'Working',
            enteredAt: new Date(now.getTime() - 5 * oneHour),
            exitedAt: new Date(now.getTime() - 4 * oneHour),
            durationMs: 1 * oneHour,
            transitionedBy: member._id
          },
          {
            stage: 'Done',
            enteredAt: new Date(now.getTime() - 4 * oneHour),
            exitedAt: new Date(now.getTime() - 4 * oneHour),
            durationMs: 0,
            transitionedBy: member._id
          }
        ]
      }
    ];

    await Task.insertMany(tasks);
    console.log(`[Seed] Seeded ${tasks.length} tasks successfully!`);

    await mongoose.disconnect();
    console.log('[Seed] Database populated successfully and connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
