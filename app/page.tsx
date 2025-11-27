import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Demo Website</h1>
          <div className="flex gap-4">
            <Link href="/" className="text-sm hover:underline">
              Home
            </Link>
            <Link href="/about" className="text-sm hover:underline">
              About
            </Link>
            <Link href="/contact" className="text-sm hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold" id="hero-title">
            Welcome to Our Demo Site
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            This is a demonstration page for the WebFeedback widget. Try creating
            annotations on different elements!
          </p>
          <div className="pt-4">
            <Button size="lg" className="mr-4" data-testid="cta-primary">
              Get Started
            </Button>
            <Button size="lg" variant="outline" data-testid="cta-secondary">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/50">
        <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature One</CardTitle>
              <CardDescription>
                This is a feature card that can be annotated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Click the floating widget button to add annotations to any element
                on this page.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Two</CardTitle>
              <CardDescription>
                Another feature card for testing annotations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Annotations create GitHub issues automatically and sync comments
                back to the page.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Three</CardTitle>
              <CardDescription>
                Test the annotation system on various elements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Try annotating buttons, cards, headings, or any other element
                you see on the page.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Form Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Contact Form</CardTitle>
            <CardDescription>
              This form can also be annotated for feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                className="w-full mt-1 px-3 py-2 border rounded-md"
                rows={4}
                placeholder="Your message..."
              />
            </div>
            <Button className="w-full">Submit</Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Demo Website - WebFeedback Widget Testing</p>
        </div>
      </footer>
    </div>
  );
}
