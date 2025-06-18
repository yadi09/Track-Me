interface StatCardProps {
  title: string;
  value: number;
  bgColor: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, bgColor, icon }: StatCardProps) => {
  return (
    <div className={`${bgColor} rounded-xl p-6 text-white shadow-md transition-transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <h3 className="mt-4 text-4xl font-semibold">{value}</h3>
        </div>
        <div className="text-3xl opacity-80">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard; 