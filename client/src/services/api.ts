const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
}

export async function getDashboardData(token: string) {
  console.log("Making dashboard request with token:", token ? "Token present" : "No token");
  const res = await fetch(`http://localhost:5001/api/admin/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });
  console.log("Full response:", {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
    type: res.type,
    url: res.url
  });
  
  let data;
  try {
    data = await res.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error parsing response:", error);
    data = {};
  }
  if (!res.ok) throw new Error(data.message || 'Failed to fetch dashboard data');
  return data;
}

export async function getProjectById(token: string, projectId: string) {
  const res = await fetch(`http://localhost:5001/api/admin/projects/${projectId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) throw new Error(data.message || 'Failed to fetch project');
  return data;
}

export async function generateTaskAISummary(token: string, projectId: string, taskId: string, commitId?: string) {
  const res = await fetch(`http://localhost:5001/api/admin/generate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ projectId, taskId, commitId }),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) throw new Error(data.message || 'Failed to generate AI summary');
  return data;
} 