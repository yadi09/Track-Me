import fetch from 'node-fetch';

class GitServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'GitServiceError';
    this.statusCode = statusCode;
  }
}

export const fetchGitDiff = async (url, repoType, token = null) => {
  try {
    const headers = {
      'Accept': 'text/plain',
      'User-Agent': 'Track-Me-App'  // Required for GitHub API
    };
    
    // Add auth headers if token exists
    if (token) {
      if (repoType === 'github') {
        headers['Authorization'] = `token ${token}`;
      } else if (repoType === 'gitlab') {
        headers['PRIVATE-TOKEN'] = token;
      }
    }

    const response = await fetch(url, { headers });
    
    // Handle rate limit errors specifically
    if (response.status === 403 && !token) {
      throw new GitServiceError(
        `Rate limit exceeded. Consider using an API token for higher limits.`,
        403
      );
    }

    if (!response.ok) {
      throw new GitServiceError(
        `Failed to fetch diff: ${response.statusText}`,
        response.status
      );
    }

    const diffContent = await response.text();
    
    // Basic validation of diff content
    if (!diffContent || !diffContent.includes('diff --git')) {
      throw new GitServiceError(
        'Invalid diff content received',
        400
      );
    }

    return diffContent;
  } catch (error) {
    if (error instanceof GitServiceError) {
      throw error;
    }
    
    // Handle network or other errors
    throw new GitServiceError(
      `Error fetching git diff: ${error.message}`,
      500
    );
  }
};

// Helper to determine if repository is private and check access
export const checkRepoAccess = async (repoType, username, repoName, token = null) => {
  try {
    const headers = {
      'User-Agent': 'Track-Me-App'
    };

    // Add token if available (recommended even for public repos)
    if (token) {
      if (repoType === 'github') {
        headers['Authorization'] = `token ${token}`;
      } else if (repoType === 'gitlab') {
        headers['PRIVATE-TOKEN'] = token;
      }
    }

    let url;
    if (repoType === 'github') {
      url = `https://api.github.com/repos/${username}/${repoName}`;
    } else if (repoType === 'gitlab') {
      url = `https://gitlab.com/api/v4/projects/${username}%2F${repoName}`;
    } else {
      throw new GitServiceError('Unsupported repository type', 400);
    }

    const response = await fetch(url, { headers });

    // Handle rate limit errors
    if (response.status === 403 && !token) {
      return {
        exists: true, // Assume it exists if we hit rate limit
        isPrivate: null,
        rateLimited: true
      };
    }
    
    if (!response.ok) {
      if (response.status === 404) {
        return { 
          exists: false, 
          isPrivate: null,
          rateLimited: false
        };
      }
      throw new GitServiceError(
        `Failed to check repository: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return {
      exists: true,
      isPrivate: repoType === 'github' ? data.private : !data.public,
      rateLimited: false
    };
  } catch (error) {
    if (error instanceof GitServiceError) {
      throw error;
    }
    throw new GitServiceError(
      `Error checking repository access: ${error.message}`,
      500
    );
  }
}; 