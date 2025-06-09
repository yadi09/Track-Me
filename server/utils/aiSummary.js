import fetch from 'node-fetch';

export const generateAISummary = async (commitDiff, type = 'task') => {
  const API_URL = "https://router.huggingface.co/novita/v3/openai/chat/completions";
  
  const prompt = type === 'task' 
    ? `Analyze this Git commit diff and provide a clear, concise summary of the changes made:\n\n${commitDiff}`
    : `Analyze these Git commit diffs and provide a comprehensive project progress summary:\n\n${commitDiff}`;

  try {
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
            content: "You are a helpful programming instructor who provides clear, detailed explanations with examples."
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
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Summary Generation Error:', error);
    throw new Error('Failed to generate AI summary');
  }
};