import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  status: 'completed' | 'pending' | 'in-progress';
  projectId: string;
}

interface TaskListProps {
  tasks: Task[];
  totalProgress: number;
}

const TaskList = ({ tasks, totalProgress }: TaskListProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-orange-600';
      case 'in-progress':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#2B3674] mb-2">Today's Tasks</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-700">{totalProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer active:scale-[0.98]"
            onClick={() => navigate(`/projects/${task.projectId}/tasks/${task.id}`)}
          >
            <div className="flex justify-between items-start gap-4">
              <h4 className="text-sm font-medium text-gray-800 truncate flex-1">
                {task.title}
              </h4>
              <span className={`text-xs font-medium whitespace-nowrap px-2 py-1 rounded-full ${
                getStatusColor(task.status)
              } bg-opacity-10`}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList; 