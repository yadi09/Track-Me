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
  commitUrl: String,  // Store the full commit URL
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
  repoType: {
    type: String,
    enum: ['github', 'gitlab'],
    required: true
  },
  repoUsername: {
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
    required: true,
    validate: {
      validator: function(value) {
        // For new projects, ensure start date is not in the past
        if (this.isNew) {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          return value >= now;
        }
        return true; // Don't validate for existing projects
      },
      message: 'Project start date cannot be in the past'
    }
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'Project end date must be after start date'
    }
  },
  tasks: [taskSchema]
}, {
  timestamps: true
});

// Helper method to generate commit URL
projectSchema.methods.generateCommitUrl = function(commitId) {
  const { repoType, repoUsername, repoName } = this;
  
  if (repoType === 'github') {
    return `https://github.com/${repoUsername}/${repoName}/commit/${commitId}.diff`
  } else if (repoType === 'gitlab') {
    return `https://gitlab.com/${repoUsername}/${repoName}/-/commit/${commitId}.diff`;
  }
  throw new Error('Unsupported repository type');
};

// Helper method to check and update deadline status
projectSchema.methods.checkDeadline = function() {
  const now = new Date();
  const hasActiveTasks = this.tasks.some(t => t.status === 'pending');
  
  // Only update to outOfDeadline if:
  // 1. Current date is past the project end date
  // 2. Project has pending tasks
  // 3. Project is not already completed or canceled
  if (now > this.endDate && 
      hasActiveTasks && 
      !['completed', 'canceled'].includes(this.status)) {
    this.status = 'outOfDeadline';
    return true;
  }
  return false;
};

const Project = mongoose.model('Project', projectSchema);

export default Project;