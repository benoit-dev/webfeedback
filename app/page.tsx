'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Github, Zap, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">WebFeedback</h1>
          <Link href="/widget/create">
            <Button>Create Widget</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight" id="hero-title">
            Collect Feedback Directly on Your Website
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            The WebFeedback widget lets users annotate any element on your site and automatically creates GitHub issues. 
            Streamline your feedback workflow with visual annotations and seamless GitHub integration.
          </p>
          <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/widget/create">
              <Button size="lg" className="w-full sm:w-auto" data-testid="cta-primary">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto"
              data-testid="cta-secondary"
              onClick={() => {
                const element = document.getElementById('pain-points');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section id="pain-points" className="w-full bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">The problem</h2>
            <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Collecting and managing website feedback is fragmented and time-consuming
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-destructive" />
                    <CardTitle>Scattered feedback</CardTitle>
                  </div>
                  <CardDescription>
                    Feedback comes through emails, Slack, support tickets, and screenshots. 
                    It's hard to track what needs attention and where issues are located.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-destructive" />
                    <CardTitle>Context loss</CardTitle>
                  </div>
                  <CardDescription>
                    Screenshots and vague descriptions make it difficult to understand 
                    exactly which element needs fixing. Developers waste time hunting for issues.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-destructive" />
                    <CardTitle>Manual workflow</CardTitle>
                  </div>
                  <CardDescription>
                    Creating GitHub issues manually from feedback is tedious. 
                    Copy-pasting descriptions, uploading screenshots, and linking context takes time.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-destructive" />
                    <CardTitle>No two-way sync</CardTitle>
                  </div>
                  <CardDescription>
                    When issues are resolved, there's no easy way to show updates back on the website. 
                    Stakeholders don't see progress without checking GitHub.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">The solution</h2>
          <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            WebFeedback streamlines your entire feedback workflow
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <CardTitle>Visual annotations</CardTitle>
                </div>
                <CardDescription>
                  Users click directly on elements to provide feedback. No more guessing 
                  which button or section needs attention. Precise, contextual annotations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Github className="w-5 h-5 text-primary" />
                  <CardTitle>Automatic GitHub issues</CardTitle>
                </div>
                <CardDescription>
                  Annotations automatically create GitHub issues with element selectors, 
                  screenshots, and context. No manual copy-pasting or issue creation needed.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <CardTitle>Real-time sync</CardTitle>
                </div>
                <CardDescription>
                  GitHub issue comments sync back to your website as visual markers. 
                  Show stakeholders that issues are being addressed directly on the page.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <CardTitle>Easy integration</CardTitle>
                </div>
                <CardDescription>
                  Add the widget to any website with a single script tag. 
                  No complex setup, no dependencies. Works on any framework or static site.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div className="mt-12 text-center">
            <Link href="/widget/create">
              <Button size="lg">
                Create Your Widget
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>WebFeedback - Streamline your website feedback workflow</p>
        </div>
      </footer>
    </div>
  );
}
