import "./globals.css";
import MockGate from "@/components/MockGate";

export const metadata = {
  title: "LabBridge — Build your onboarding plan",
  description:
    "From \"I'm new here\" to \"I can contribute\" — tell us where you're starting and where you're headed.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <MockGate />
        {children}
      </body>
    </html>
  );
}
