import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { BETA_BANNER_HEAD_SCRIPT } from '@/lib/beta-banner';

export const metadata: Metadata = {
  title: 'Xom Appétit',
  description: 'Cook it. Log it. Rate it. Get roasted.',
};

// Without this, mobile browsers fall back to a ~980px desktop viewport, so
// content overflows and users have to pinch-zoom to read. Locking zoom
// matches the user's "feels like a real app" goal — pages render at the
// device width and stay there.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the head script may add data-beta-dismissed before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BETA_BANNER_HEAD_SCRIPT }} />
      </head>
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased">
        {GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${GA4_ID}');
              `}
            </Script>
          </>
        )}
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
