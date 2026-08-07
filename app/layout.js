import Script from 'next/script';
import './globals.css';

export const metadata = {
    title: 'Daily Planner',
    description: 'A local-first daily planning app.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
                <Script
                    src="https://kit.fontawesome.com/44d855bf5c.js"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    strategy="afterInteractive"
                />
            </body>
        </html>
    );
}
