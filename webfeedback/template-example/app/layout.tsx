import type { Metadata } from "next";
import "./globals.css";
import { WebFeedbackWidget } from "./webfeedback-wrapper";

export const metadata: Metadata = {
  title: "WebFeedback Example",
  description: "Example project using WebFeedback widget",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <WebFeedbackWidget />
      </body>
    </html>
  );
}

