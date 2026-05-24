import './globals.css';

export const metadata = {
  title: 'MDD Care - รพ.คลองหาด แผนกจิตเวช',
  description: 'ระบบบริหารจัดการและติดตามคนไข้โรคซึมเศร้า (Digital 100% / Paperless)',
  viewport: 'width=device-width, initial-scale=1'
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('mdd-theme');
                if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
