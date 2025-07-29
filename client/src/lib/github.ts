export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  branch?: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  content: string;
  sha?: string;
}

export class GitHubAPI {
  private baseUrl = 'https://api.github.com';

  constructor(private config: GitHubConfig) {}

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getRepositoryFiles(path: string = ''): Promise<any[]> {
    const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
    return this.request(endpoint);
  }

  async getFileContent(path: string): Promise<GitHubFile> {
    const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
    const response = await this.request(endpoint);
    
    if (response.type !== 'file') {
      throw new Error('Path is not a file');
    }

    const content = Buffer.from(response.content, 'base64').toString('utf-8');
    
    return {
      name: response.name,
      path: response.path,
      content,
      sha: response.sha,
    };
  }

  async createOrUpdateFile(path: string, content: string, message: string, sha?: string): Promise<any> {
    const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
    const body: any = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch: this.config.branch || 'main',
    };

    if (sha) {
      body.sha = sha;
    }

    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async createPullRequest(title: string, body: string, head: string, base: string = 'main'): Promise<any> {
    const endpoint = `/repos/${this.config.owner}/${this.config.repo}/pulls`;
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
        head,
        base,
      }),
    });
  }

  async createBranch(branchName: string, fromBranch: string = 'main'): Promise<any> {
    // First get the SHA of the base branch
    const refEndpoint = `/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${fromBranch}`;
    const baseRef = await this.request(refEndpoint);
    
    // Create new branch
    const endpoint = `/repos/${this.config.owner}/${this.config.repo}/git/refs`;
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      }),
    });
  }

  async getMarkdownFiles(directory: string = ''): Promise<GitHubFile[]> {
    const files: GitHubFile[] = [];
    
    async function processDirectory(path: string): Promise<void> {
      const items = await this.getRepositoryFiles(path);
      
      for (const item of items) {
        if (item.type === 'file' && item.name.endsWith('.md')) {
          const fileContent = await this.getFileContent(item.path);
          files.push(fileContent);
        } else if (item.type === 'dir') {
          await processDirectory(item.path);
        }
      }
    }

    await processDirectory.call(this, directory);
    return files;
  }
}
