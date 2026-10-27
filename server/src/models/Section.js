import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
      maxlength: [80, 'Section name cannot exceed 80 characters']
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
    order: {
      type: Number,
      default: 0
    },
    color: {
      type: String,
      default: '#2E7D5B'
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

sectionSchema.index({ workspace: 1, order: 1 });

export const Section = mongoose.model('Section', sectionSchema);
