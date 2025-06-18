import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { useParams } from 'react-router-dom';
import { getProjectById, generateTaskAISummary } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SingleTask: React.FC = () => {
  const { token } = useAuth();
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        if (!token || !projectId || !taskId) {
          setError('Missing required parameters.');
          setLoading(false);
          return;
        }
        const data = await getProjectById(token, projectId);
        if (!data.project) {
          setError('Project not found.');
          setLoading(false);
          return;
        }
        setProject(data.project);
        const foundTask = data.project.tasks.find((t: any) => t._id === taskId || t.id === taskId);
        if (!foundTask) {
          setError('Task not found in this project.');
          setLoading(false);
          return;
        }
        setTask(foundTask);
        setAiSummary(foundTask.aiSummary || null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, projectId, taskId]);

  const handleGenerateSummary = async () => {
    if (!token || !projectId || !taskId) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await generateTaskAISummary(token, projectId, taskId, task?.commitId);
      if (res.summary) {
        setAiSummary(res.summary);
      } else {
        setAiError('No summary returned.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate summary');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 flex flex-col items-center px-2 sm:px-4 lg:px-8 py-6">
        {/* Loading and error states */}
        {loading && <div className="mt-4 text-gray-500">Loading...</div>}
        {error && <div className="mt-4 text-red-500">{error}</div>}
        {!loading && !error && project && task && (
          <>
            {/* Project Header Card */}
            <div className="w-full bg-white rounded-xl shadow-md p-4 mb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#2B3674]">{project.name}</h2>
                  <p className="text-gray-500 mt-1">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Status: {project.status}</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Repo: {project.repoName}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Progress: {project.progress}%</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Tasks: {project.completedTasks ?? 0}/{project.totalTasks ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Main Content: Task Info & AI Summary */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Task Info (Left) */}
              <div className="bg-white rounded-xl shadow-md p-4 h-[60vh] flex flex-col overflow-y-auto custom-scrollbar">
                <h3 className="text-xl font-semibold text-[#2B3674] mb-2">Task Info</h3>
                <div className="mb-4">
                  <div className="font-bold">Title:</div>
                  <div>{task.title}</div>
                </div>
                <div className="mb-4">
                  <div className="font-bold">Description:</div>
                  <div>{task.description}</div>
                </div>
                <div className="mb-4">
                  <div className="font-bold">Status:</div>
                  <div>{task.status}</div>
                </div>
                {task.status === 'canceled' && (
                  <div className="mb-4">
                    <div className="font-bold">Cancel Reason:</div>
                    <div>{task.cancelReason || '-'}</div>
                  </div>
                )}
                {task.commitMessage && (
                  <div className="mb-4">
                    <div className="font-bold">Commit Message:</div>
                    <div>{task.commitMessage}</div>
                  </div>
                )}
              </div>
              {/* AI Summary (Right) */}
              <div className="bg-white rounded-xl shadow-md p-4 h-[60vh] flex flex-col overflow-y-auto custom-scrollbar">
                <h3 className="text-xl font-semibold text-[#2B3674] mb-2">AI Summary</h3>
                <div className="flex-1 flex flex-col justify-center items-center">
                  {aiLoading ? (
                    <div className="text-purple-600">Generating summary...</div>
                  ) : aiSummary ? (
                    <div className="text-gray-700 whitespace-pre-line text-center">{aiSummary}</div>
                  ) : task.status === 'completed' ? (
                    <>
                      <button
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                        onClick={handleGenerateSummary}
                        disabled={aiLoading}
                      >
                        Generate AI Summary
                      </button>
                      {aiError && <div className="text-red-500 mt-2">{aiError}</div>}
                    </>
                  ) : (
                    <div className="text-gray-400 text-center">No summary available.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SingleTask; 