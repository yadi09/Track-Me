import express from 'express';
import { authMiddleware, adminMiddleware } from '../utils/auth.js';
import Project from '../models/Project.js';
import { generateAISummary } from '../utils/aiSummary.js';

const router = express.Router();

// Middleware to ensure admin access
router.use(authMiddleware, adminMiddleware);

// Helper function to calculate project progress
const calculateProgress = (tasks, filter) => {
  if (!tasks.length) return 0;
  
  const filteredTasks = tasks.filter(task => {
    const now = new Date();
    const taskStart = new Date(task.schedule.startDate);
    const taskEnd = new Date(task.schedule.endDate);
    
    switch (filter) {
      case 'today':
        return taskStart.toDateString() === now.toDateString();
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        return taskStart >= weekStart && taskEnd <= weekEnd;
      case 'month':
        return taskStart.getMonth() === now.getMonth() && 
               taskStart.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  if (!filteredTasks.length) return 0;
  
  const completedTasks = filteredTasks.filter(task => task.status === 'completed').length;
  return Math.round((completedTasks / filteredTasks.length) * 100);
};

// Get dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const projects = await Project.find({ adminId: req.user.id });

    const dashboardData = {
      projects: projects.map(project => ({
        id: project._id,
        name: project.name,
        status: project.status,
        progress: calculateProgress(project.tasks, filter),
        tasks: project.tasks
          .filter(task => {
            const now = new Date();
            const taskStart = new Date(task.schedule.startDate);
            
            switch (filter) {
              case 'today':
                return taskStart.toDateString() === now.toDateString();
              case 'week':
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                return taskStart >= weekStart && taskStart <= weekEnd;
              case 'month':
                return taskStart.getMonth() === now.getMonth() && 
                       taskStart.getFullYear() === now.getFullYear();
              default:
                return true;
            }
          })
          .map(task => ({
            id: task._id,
            title: task.title,
            status: task.status,
            startDate: task.schedule.startDate,
            endDate: task.schedule.endDate
          }))
      })),
      summary: {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active' || p.status === 'in-progress').length,
        completedTasks: projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'completed').length, 0),
        pendingTasks: projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'pending').length, 0)
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single project with tasks
router.get('/projects/:id', async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const project = await Project.findOne({ 
      _id: req.params.id,
      adminId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const filteredTasks = project.tasks.filter(task => {
      const now = new Date();
      const taskStart = new Date(task.schedule.startDate);
      
      switch (filter) {
        case 'today':
          return taskStart.toDateString() === now.toDateString();
        case 'week':
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
          return taskStart >= weekStart && taskStart <= weekEnd;
        case 'month':
          return taskStart.getMonth() === now.getMonth() && 
                 taskStart.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    res.json({
      project: {
        ...project.toObject(),
        tasks: filteredTasks,
        progress: calculateProgress(project.tasks, filter)
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate AI summary
router.post('/generate-summary', async (req, res) => {
  try {
    const { projectId, taskId, commitId } = req.body;

    // Fetch the project and verify ownership
    const project = await Project.findOne({
      _id: projectId,
      adminId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // If taskId is provided, generate task-level summary
    if (taskId) {
      const task = project.tasks.id(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Here you would fetch the commit diff using the GitHub API
      const commitDiff = 'Sample commit diff'; // Replace with actual GitHub API call
      const summary = await generateAISummary(commitDiff, 'task');
      
      task.aiSummary = summary;
      await project.save();

      res.json({ summary });
    } else {
      // Generate project-level summary
      const completedTasks = project.tasks.filter(t => t.status === 'completed');
      const commitDiffs = completedTasks.map(t => t.aiSummary).join('\n\n');
      const summary = await generateAISummary(commitDiffs, 'project');

      res.json({ summary });
    }
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;