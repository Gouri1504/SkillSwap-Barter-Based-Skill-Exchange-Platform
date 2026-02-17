import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillSwap — Barter-Based Skill Exchange Platform',
  description: 'Exchange skills instead of money. Find your perfect skill match, book sessions, and learn from each other.',
  keywords: ['skill exchange', 'barter', 'learning', 'teaching', 'skills'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen t-bg t-text antialiased transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                className: '!bg-[rgb(var(--bg-card))] !text-[rgb(var(--text-primary))] !border !border-[rgb(var(--border))]',
                success: {
                  iconTheme: { primary: '#5c7cfa', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#e64980', secondary: '#fff' },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
