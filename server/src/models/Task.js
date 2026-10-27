import mongoose from 'mongoose';

const stageHistorySchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: ['Allocated', 'Working', 'Done'],
      required: true
    },
    enteredAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    exitedAt: {
      type: Date,
      default: null
    },
    durationMs: {
      type: Number,
      default: 0
    },
    transitionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { _id: true }
);

const sectionHistorySchema = new mongoose.Schema(
  {
    fromSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section'
    },
    toSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true
    },
    transitionedAt: {
      type: Date,
      default: Date.now
    },
    transitionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true
    },
    // Track which section the task was completed in for section average metrics
    completionSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
      index: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    currentStage: {
      type: String,
      enum: ['Allocated', 'Working', 'Done'],
      default: 'Allocated',
      index: true
    },
    stageEnteredAt: {
      type: Date,
      default: Date.now
    },
    workflowStartedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    // Cumulative finished durations stored in ms
    allocatedDurationMs: {
      type: Number,
      default: 0
    },
    workingDurationMs: {
      type: Number,
      default: 0
    },
    completionDurationMs: {
      type: Number,
      default: null
    },
    dueDate: {
      type: Date,
      default: null
    },
    // SLA properties
    slaTargetMinutes: {
      type: Number,
      default: 120 // 2 hours default
    },
    slaStartedAt: {
      type: Date,
      default: Date.now
    },
    slaDeadline: {
      type: Date,
      default: function () {
        const start = this.slaStartedAt || new Date();
        const minutes = this.slaTargetMinutes || 120;
        return new Date(new Date(start).getTime() + minutes * 60 * 1000);
      }
    },
    slaMet: {
      type: Boolean,
      default: null
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    stageHistory: [stageHistorySchema],
    sectionHistory: [sectionHistorySchema],
    comments: [commentSchema],
    attachments: [attachmentSchema],
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for high performance
taskSchema.index({ workspace: 1, currentStage: 1 });
taskSchema.index({ section: 1, currentStage: 1 });
taskSchema.index({ workspace: 1, section: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Task = mongoose.model('Task', taskSchema);
