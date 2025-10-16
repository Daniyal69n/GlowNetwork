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
<<<<<<< HEAD
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/icons/site.webmanifest',
=======
    icon: '/glow-network-logo.png',
    shortcut: '/glow-network-logo.png',
    apple: '/glow-network-logo.png',
  },
>>>>>>> 224c81a5ca346fde23e85b03bd74565efe746b8e
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Global WhatsApp floating contact: replace with your info */}
        <WhatsAppContact phoneNumber="+923069207761" displayName="Sahar Maqsood" />
      </body>
    </html>
  );
}