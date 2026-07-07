import "./globals.css";

export const metadata = {
  title: "LabBridge — Build your onboarding plan",
  description:
    "From \"I'm new here\" to \"I can contribute\" — tell us where you're starting and where you're headed.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
