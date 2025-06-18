import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import Project from '../models/Project.js';

const router = express.Router();

// Middleware to ensure developer access
router.use(authMiddleware, (req, res, next) => {
  if (req.user.role !== 'developer') {
    return res.status(403).json({ message: 'Developer access required' });
  }
  next();
});

// Create new project
router.post('/projects', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      repoName,
      repoType,
      adminId, 
      startDate, 
      endDate 
    } = req.body;

    // Validate required fields
    if (!name || !repoName || !repoType || !adminId || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    // Validate repository type
    if (!['github', 'gitlab'].includes(repoType)) {
      return res.status(400).json({ 
        message: 'Repository type must be either "github" or "gitlab"' 
      });
    }

    // Convert dates to Date objects for comparison
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // Set current time to start of day for fair comparison
    now.setHours(0, 0, 0, 0);

    // Validate dates
    if (start < now) {
      return res.status(400).json({
        message: 'Project start date cannot be in the past'
      });
    }

    if (end < start) {
      return res.status(400).json({
        message: 'Project end date must be after start date'
      });
    }

    // Create project with developer's username for the repo
    const project = new Project({
      name,
      description,
      repoName,
      repoType,
      repoUsername: req.user.username,
      adminId,
      startDate,
      endDate,
      status: 'active'
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

// Add task to project
router.post('/projects/:projectId/tasks', async (req, res) => {
  try {
    const { title, description, schedule } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.tasks.push({
      title,
      description,
      schedule,
      status: 'pending'
    });

    if (project.status === 'active' && project.tasks.some(t => t.status === 'completed')) {
      project.status = 'in-progress';
    }

    await project.save();
    res.status(201).json(project.tasks[project.tasks.length - 1]);
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status
router.patch('/projects/:projectId/tasks/:taskId/status', async (req, res) => {
  try {
    const { status, commitId, cancelReason } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = project.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    if (status === 'completed') {
      task.commitId = commitId;
      task.commitUrl = project.generateCommitUrl(commitId);
    } else if (status === 'canceled') {
      task.cancelReason = cancelReason;
    }

    // Update project status based on tasks
    const hasCompletedTasks = project.tasks.some(t => t.status === 'completed');
    const allTasksCompleted = project.tasks.every(t => 
      t.status === 'completed' || t.status === 'canceled'
    );
    const hasActiveTasks = project.tasks.some(t => t.status === 'pending');

    if (allTasksCompleted) {
      project.status = 'completed';
    } else if (hasCompletedTasks) {
      project.status = 'in-progress';
    }

    // Check for deadline
    const now = new Date();
    if (now > project.endDate && hasActiveTasks) {
      project.status = 'outOfDeadline';
    }

    await project.save();
    res.json(task);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all projects for developer
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project
router.put('/projects/:id', async (req, res) => {
  try {
    const { name, description, repoName, startDate, endDate } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.name = name || project.name;
    project.description = description || project.description;
    project.repoName = repoName || project.repoName;
    project.startDate = startDate || project.startDate;
    project.endDate = endDate || project.endDate;

    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel project
router.patch('/projects/:id/cancel', async (req, res) => {
  try {
    const { cancelReason } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.status = 'canceled';
    project.cancelReason = cancelReason;

    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Cancel project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;