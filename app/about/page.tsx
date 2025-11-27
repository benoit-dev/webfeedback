import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function About() {
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

      {/* About Content */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <h2 className="text-4xl font-bold mb-6">About Us</h2>
        
        <div className="space-y-6 text-lg">
          <p className="text-muted-foreground">
            This is the About page. You can annotate any element here to test
            the WebFeedback widget across different pages.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We aim to make web feedback collection seamless and integrated
                with your development workflow through GitHub issues.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The WebFeedback widget allows users to annotate elements on your
                website directly.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Click the floating widget button</li>
                <li>Select &quot;Add Annotation&quot;</li>
                <li>Click on any element to annotate it</li>
                <li>A GitHub issue is created automatically</li>
                <li>Comments on the issue appear on the website</li>
              </ul>
            </CardContent>
          </Card>

          <div className="bg-muted p-6 rounded-lg">
            <h3 className="text-2xl font-semibold mb-4">Try It Out</h3>
            <p>
              Annotate this section, the cards above, or any other element on
              this page. The widget works across all pages of your website.
            </p>
          </div>
        </div>
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

