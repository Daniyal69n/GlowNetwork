import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WhatsAppContact from "./components/WhatsAppContact.jsx";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Glow Network - MLM Platform",
  description: "Network Marketing Platform with Multi-Level Marketing System",
  icons: {
    icon: '/glow-network-logo.png',
    shortcut: '/glow-network-logo.png',
    apple: '/glow-network-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Global WhatsApp floating contact: replace with your info */}
        <WhatsAppContact phoneNumber="+923278805684" displayName="Sahar Maqsood" />
      </body>
    </html>
  );
}