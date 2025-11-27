export interface Annotation {
  id: string;
  elementSelector: string;
  pageUrl: string;
  issueNumber: number;
  issueUrl: string;
  createdAt: string;
  screenshot?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  labels: Array<{ name: string; color: string }>;
}

export interface GitHubComment {
  id: number;
  body: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
}

export interface AnnotationWithComments extends Annotation {
  issue: GitHubIssue;
  comments: GitHubComment[];
  commentCount: number;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  labels?: string[];
}

