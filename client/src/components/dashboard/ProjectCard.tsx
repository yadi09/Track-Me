interface ProjectCardProps {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: number;
}

const ProjectCard = ({ name, description, startDate, endDate, progress }: ProjectCardProps) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md mb-4 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-[#2B3674] mb-2">{name}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      
      <div className="flex justify-between text-sm text-gray-500 mb-4">
        <div>
          <p>Start: {startDate}</p>
          <p>End: {endDate}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard; 