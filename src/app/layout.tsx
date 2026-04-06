import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "X-Social | Premium Social Network",
  description: "Connect with creators and explorers in a secure, high-end social environment.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "X-Social",
  },
};

export const viewport: Viewport = {
  themeColor: "black",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark overflow-x-hidden w-full min-h-[100dvh]">
      <ThemeProvider>
        <body 
          className="antialiased bg-background text-foreground min-h-[100dvh] w-full overflow-x-hidden transition-colors duration-300"
          suppressHydrationWarning
        >
          <ClientLayout>
            {children}
          </ClientLayout>
        </body>
      </ThemeProvider>
    </html>
  );
}