import Project from '../models/Project.js';

// Check project deadlines every hour
export const startDeadlineChecker = () => {
  const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
  
  const checkDeadlines = async () => {
    try {
      // Get all non-canceled, non-completed projects
      const projects = await Project.find({
        status: { 
          $nin: ['canceled', 'completed'] 
        }
      });

      // Check each project's deadline
      const updates = projects.map(async (project) => {
        if (project.checkDeadline()) {
          await project.save();
        }
      });

      await Promise.all(updates);
    } catch (error) {
      console.error('Deadline checker error:', error);
    }
  };

  // Run immediately on startup
  checkDeadlines();
  
  // Then run every hour
  setInterval(checkDeadlines, ONE_HOUR);
}; 