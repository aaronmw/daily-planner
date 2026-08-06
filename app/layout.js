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
                    src="https://kit.fontawesome.com/fc8b5f7417.js"
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />
            </body>
        </html>
    );
}
