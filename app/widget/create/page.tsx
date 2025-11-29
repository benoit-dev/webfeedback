'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

export default function CreateWidgetPage() {
  const [name, setName] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [allowedDomains, setAllowedDomains] = useState('');
  const [createdWidget, setCreatedWidget] = useState<{
    apiKey: string;
    scriptTag: string;
  } | null>(null);

  const createMutation = trpc.widget.customers.create.useMutation({
    onSuccess: (data) => {
      setCreatedWidget({
        apiKey: data.apiKey,
        scriptTag: data.scriptTag,
      });
      toast.success('Widget created successfully!');
      // Reset form
      setName('');
      setGithubToken('');
      setGithubOwner('');
      setGithubRepo('');
      setAllowedDomains('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create widget');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse domains from textarea (one per line)
    const domains = allowedDomains
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    if (domains.length === 0) {
      toast.error('Please enter at least one allowed domain');
      return;
    }

    createMutation.mutate({
      name,
      githubToken,
      githubOwner,
      githubRepo,
      allowedDomains: domains,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Widget</CardTitle>
            <CardDescription>
              Enter your GitHub information and allowed domains to generate a widget script tag.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {createdWidget ? (
              <div className="space-y-6">
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    Widget Created Successfully!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your widget has been created. Use the information below to embed it on your website.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>API Key</Label>
                    <div className="mt-1 flex gap-2">
                      <Input
                        value={createdWidget.apiKey}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(createdWidget.apiKey);
                          toast.success('API key copied to clipboard');
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Script Tag</Label>
                    <div className="mt-1 space-y-2">
                      <Textarea
                        value={createdWidget.scriptTag}
                        readOnly
                        className="font-mono text-sm"
                        rows={2}
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(createdWidget.scriptTag);
                          toast.success('Script tag copied to clipboard');
                        }}
                      >
                        Copy Script Tag
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add this script tag to your HTML to embed the widget.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCreatedWidget(null)}
                  className="w-full"
                >
                  Create Another Widget
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Project"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    A friendly name to identify this widget
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="githubToken">GitHub Token *</Label>
                  <Input
                    id="githubToken"
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_..."
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Your GitHub personal access token with <code className="text-xs bg-muted px-1 py-0.5 rounded">repo</code> and <code className="text-xs bg-muted px-1 py-0.5 rounded">issues:write</code> permissions
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="githubOwner">GitHub Owner *</Label>
                    <Input
                      id="githubOwner"
                      value={githubOwner}
                      onChange={(e) => setGithubOwner(e.target.value)}
                      placeholder="username"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Your GitHub username or organization
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="githubRepo">GitHub Repository *</Label>
                    <Input
                      id="githubRepo"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      placeholder="repository-name"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Repository name where issues will be created
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedDomains">Allowed Domains *</Label>
                  <Textarea
                    id="allowedDomains"
                    value={allowedDomains}
                    onChange={(e) => setAllowedDomains(e.target.value)}
                    placeholder="example.com&#10;www.example.com&#10;app.example.com"
                    rows={4}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter one domain per line. Only these domains will be allowed to use your widget. Examples: <code className="text-xs bg-muted px-1 py-0.5 rounded">example.com</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">www.example.com</code>
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Widget'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Need help? Check out the{' '}
            <a href="/docs/script-embedding" className="underline hover:text-foreground">
              documentation
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

