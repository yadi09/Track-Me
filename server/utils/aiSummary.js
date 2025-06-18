import fetch from 'node-fetch';
import { fetchGitDiff } from './gitService.js';

export const generateAISummary = async (commitUrl, repoType, token = null, type = 'task') => {
  try {
    // First fetch the diff content
    const diffContent = await fetchGitDiff(commitUrl, repoType, token);

    const API_URL = "https://router.huggingface.co/novita/v3/openai/chat/completions";
    
    const prompt = type === 'task' 
      ? `Analyze the following Git diff and provide a clear summary in this format:

📝 Summary
[Provide a high-level overview of the changes in 1-2 sentences]

📂 Files Modified
[List each modified file with a brief description of changes]

🔧 Key Changes
- [List major functional changes]
- [List bug fixes]
- [List improvements]

💡 Impact
[Explain how these changes affect the system/users]

Git Diff Content:
${diffContent}`
      : `Review the following Git diffs and provide a comprehensive project progress summary in this format:

📊 Progress Overview
[High-level summary of project progress]

🎯 Key Achievements
- [List major features completed]
- [List significant improvements]
- [List bug fixes]

📈 Impact Analysis
[Explain how these changes contribute to project goals]

🚀 Next Steps
[Suggest logical next steps based on these changes]

Git Diff Content:
${diffContent}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a helpful programming instructor who provides clear, detailed explanations with examples. You analyze Git diffs and provide structured, actionable summaries."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "deepseek/deepseek-v3-0324",
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`AI API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Summary Generation Error:', error);
    throw new Error(`Failed to generate AI summary: ${error.message}`);
  }
};