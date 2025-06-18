import { useEffect, useState } from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon, DocumentIcon } from '@heroicons/react/24/outline';
import StatCard from '../components/dashboard/StatCard';
import ProjectCard from '../components/dashboard/ProjectCard';
import TaskList from '../components/dashboard/TaskList';
import { getDashboardData } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<{ tasks: any[]; totalProgress: number }>({ tasks: [], totalProgress: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        console.log("Fetching dashboard data...");
        const data = await getDashboardData(token!);
        console.log("Raw dashboard data received:", data);
        
        if (!data || !data.summary) {
          console.error("Invalid data structure:", data);
          setError('Dashboard data is missing or malformed.');
          setLoading(false);
          return;
        }

        const summaryData = [
          {
            title: 'Total Projects',
            value: data.summary.totalProjects ?? 0,
            bgColor: 'bg-blue-500',
            icon: <DocumentIcon className="h-8 w-8" />,
          },
          {
            title: 'Active Projects',
            value: data.summary.activeProjects ?? 0,
            bgColor: 'bg-purple-500',
            icon: <ClockIcon className="h-8 w-8" />,
          },
          {
            title: 'Completed Projects',
            value: data.summary.completedProjects ?? 0,
            bgColor: 'bg-green-500',
            icon: <CheckCircleIcon className="h-8 w-8" />,
          },
          {
            title: 'Out of Deadline',
            value: data.summary.outOfDeadlineProjects ?? 0,
            bgColor: 'bg-red-500',
            icon: <ExclamationCircleIcon className="h-8 w-8" />,
          },
        ];
        console.log("Setting stats:", summaryData);
        setStats(summaryData);

        const projects = Array.isArray(data.activeProjects) ? data.activeProjects : [];
        console.log("Setting active projects:", projects);
        setActiveProjects(projects);

        const tasksData = {
          tasks: Array.isArray(data.todaysTasks) ? data.todaysTasks : [],
          totalProgress: data.summary.todaysTasks?.progress ?? 0,
        };
        console.log("Setting today's tasks:", tasksData);
        setTodaysTasks(tasksData);
      } catch (err: any) {
        console.error("Dashboard error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Debug log
  console.log('Active Projects:', activeProjects);

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh] text-lg text-gray-500">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-[60vh] text-lg text-red-500">{error}</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Active Projects Section */}
        <div className="lg:col-span-3 bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold text-[#2B3674] mb-6">Active Projects</h2>
          <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-4 custom-scrollbar">
            {activeProjects.length === 0 ? (
              <div>
                <div className="text-gray-400 text-center py-8">No active projects.</div>
              </div>
            ) : (
              activeProjects.map((project, index) => (
                <ProjectCard
                  key={project.id || index}
                  name={project.name}
                  description={project.description}
                  startDate={project.startDate?.slice(0, 10)}
                  endDate={project.endDate?.slice(0, 10)}
                  progress={project.progress}
                />
              ))
            )}
          </div>
        </div>

        {/* Today's Tasks Section */}
        <div className="lg:col-span-1">
          <TaskList tasks={todaysTasks.tasks} totalProgress={todaysTasks.totalProgress} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 