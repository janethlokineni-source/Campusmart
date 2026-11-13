import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WeekendAnnouncementBanner from '@/components/layout/WeekendAnnouncementBanner';
import AssistantLoader from '@/components/assistant/AssistantLoader';

export const metadata: Metadata = {
  title: 'CampusMart | Premium University Campus Marketplace & Hostel Delivery',
  description:
    'CampusMart is the dedicated modern online marketplace for university campus life. Order authentic electronics, clothing, books, dorm essentials, and stationery delivered directly to your hostel room.',
  keywords: ['campus mart', 'university e-commerce', 'hostel delivery', 'college store', 'student market'],
  icons: {
    icon: '/campusmart-mark.svg',
    shortcut: '/campusmart-mark.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-[#080808] text-neutral-100 font-sans selection:bg-[#FF6A00]/30 selection:text-white antialiased">
        {/* Sticky Weekend Notice Banner */}
        <WeekendAnnouncementBanner />

        {/* Global Navigation Bar */}
        <Navbar />

        {/* Main Page Body */}
        <main className="flex-1 relative z-10">{children}</main>

        {/* Global Footer */}
        <Footer />

        {/* Lazy-Loaded AI Shopping Assistant */}
        <AssistantLoader />
      </body>
    </html>
  );
}
