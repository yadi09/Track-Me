import express from 'express';
import { authMiddleware, adminMiddleware } from '../utils/auth.js';
import Project from '../models/Project.js';
import { generateAISummary } from '../utils/aiSummary.js';
import { checkRepoAccess } from '../utils/gitService.js';

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
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all projects for this admin
    const projects = await Project.find({ 
      adminId: req.user.id,
      // Exclude canceled projects
      status: { $ne: 'canceled' }
    });

    // Check and update deadline status for all projects
    const projectUpdates = projects.map(async (project) => {
      if (project.checkDeadline()) {
        await project.save();
      }
      return project;
    });
    await Promise.all(projectUpdates);

    // Get all active projects with their progress
    const activeProjects = projects
      .filter(project => ['active', 'in-progress'].includes(project.status))
      .map(project => {
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          id: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
          repoName: project.repoName,
          repoType: project.repoType,
          startDate: project.startDate,
          endDate: project.endDate,
          progress,
          totalTasks,
          completedTasks
        };
      });

    // Get all tasks scheduled for today
    const todaysTasks = projects.flatMap(project => {
      return project.tasks
        .filter(task => {
          const taskStart = new Date(task.schedule.startDate);
          return taskStart >= today && taskStart < tomorrow;
        })
        .map(task => ({
          id: task._id,
          title: task.title,
          description: task.description,
          status: task.status,
          projectId: project._id,
          projectName: project.name,
          schedule: task.schedule,
          commitUrl: task.commitUrl,
          aiSummary: task.aiSummary
        }));
    });

    // Calculate today's tasks progress
    const todaysProgress = {
      total: todaysTasks.length,
      completed: todaysTasks.filter(t => t.status === 'completed').length,
      pending: todaysTasks.filter(t => t.status === 'pending').length,
      canceled: todaysTasks.filter(t => t.status === 'canceled').length,
      progress: todaysTasks.length > 0 
        ? Math.round((todaysTasks.filter(t => t.status === 'completed').length / todaysTasks.length) * 100)
        : 0
    };

    // Calculate overall summary
    const summary = {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      outOfDeadlineProjects: projects.filter(p => p.status === 'outOfDeadline').length,
      todaysTasks: todaysProgress
    };

    res.json({
      activeProjects,
      todaysTasks,
      summary
    });
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
    const { projectId, taskId, commitId, repoUsername } = req.body;

    // Fetch the project and verify ownership
    const project = await Project.findOne({
      _id: projectId,
      adminId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get token if available (recommended even for public repos)
    const token = process.env[`${project.repoType.toUpperCase()}_TOKEN`];

    // Use provided username or fallback to project's username
    const username = repoUsername || project.repoUsername;

    // Check repository access
    const repoAccess = await checkRepoAccess(
      project.repoType,
      username,
      project.repoName,
      token
    );

    if (!repoAccess.exists) {
      return res.status(404).json({ 
        message: 'Repository not found. Please check the repository details.' 
      });
    }

    // Update project's repoUsername if different
    if (repoUsername && repoUsername !== project.repoUsername) {
      project.repoUsername = repoUsername;
      await project.save();
    }

    // Warn about rate limits
    if (repoAccess.rateLimited) {
      console.warn(`Rate limit reached for ${project.repoType}. Consider adding an API token.`);
    }

    // For private repos, token is required
    if (repoAccess.isPrivate && !token) {
      return res.status(403).json({ 
        message: `API token required for private ${project.repoType} repositories. Please add ${project.repoType.toUpperCase()}_TOKEN to environment variables.`
      });
    }

    // If taskId is provided, generate task-level summary
    if (taskId) {
      const task = project.tasks.id(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      try {
        // Generate commit URL and get AI summary
        const commitUrl = project.generateCommitUrl(commitId);
        console.log('Fetching diff from URL:', commitUrl); // Debug log

        const summary = await generateAISummary(
          commitUrl,
          project.repoType,
          token,
          'task'
        );
        
        task.commitUrl = commitUrl;
        task.aiSummary = summary;
        await project.save();

        res.json({ 
          summary,
          rateLimited: repoAccess.rateLimited,
          commitUrl // Include URL in response for debugging
        });
      } catch (error) {
        console.error('Error generating summary:', error);
        res.status(error.statusCode || 500).json({
          message: `Failed to generate summary: ${error.message}`,
          rateLimited: error.statusCode === 403,
          commitUrl: project.generateCommitUrl(commitId) // Include URL in error response
        });
      }
    } else {
      // Generate project-level summary
      const completedTasks = project.tasks.filter(t => t.status === 'completed');
      
      // Get summaries for all completed tasks
      const summaryPromises = completedTasks.map(task => 
        generateAISummary(
          task.commitUrl,
          project.repoType,
          token, // Token is optional for public repos
          'task'
        )
      );

      const taskSummaries = await Promise.all(summaryPromises);
      const combinedDiff = taskSummaries.join('\n\n---\n\n');
      
      // Generate overall project summary
      const summary = await generateAISummary(
        combinedDiff,
        project.repoType,
        token,
        'project'
      );

      res.json({ 
        summary,
        rateLimited: repoAccess.rateLimited
      });
    }
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Server error',
      rateLimited: error.statusCode === 403
    });
  }
});

export default router;