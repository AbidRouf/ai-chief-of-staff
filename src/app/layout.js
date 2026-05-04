import "./globals.css";

export const metadata = {
  title: "AI Chief of Staff",
  description: "Intelligent triage system for CEO morning communications. Processes email, Slack, and WhatsApp messages with AI-powered categorization, delegation, and daily briefing generation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
