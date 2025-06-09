import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'canceled'],
    default: 'pending'
  },
  cancelReason: String,
  commitId: String,
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  aiSummary: String
}, {
  timestamps: true
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  repoName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'in-progress', 'outOfDeadline', 'completed', 'canceled'],
    default: 'active'
  },
  cancelReason: String,
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  tasks: [taskSchema]
}, {
  timestamps: true
});

const Project = mongoose.model('Project', projectSchema);

export default Project;