export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">WebFeedback Example</h1>
        <p className="text-lg text-muted-foreground mb-8">
          This is an example page demonstrating the WebFeedback widget.
          Click the floating button in the bottom-right corner to add annotations.
        </p>
        
        <div className="space-y-4">
          <section className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Section 1</h2>
            <p className="text-muted-foreground">
              You can annotate any element on this page. Try clicking the widget
              button and selecting this section!
            </p>
          </section>

          <section className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Section 2</h2>
            <p className="text-muted-foreground">
              Annotations are automatically synced with GitHub issues. You can
              view all issues by clicking the "All Issues" button in the widget.
            </p>
          </section>

          <section className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Section 3</h2>
            <p className="text-muted-foreground">
              Comments on GitHub issues will appear as markers on the annotated
              elements. Toggle the "Show comments" switch to show/hide markers.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

