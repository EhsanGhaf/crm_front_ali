import type { Metadata } from "next";
import { Toaster } from 'sonner';
import localFont from "next/font/local";
import { ThemeProvider } from 'next-themes';
import "./globals.css";

const vazirFont = localFont({
  src: [
    {
      path: "./fonts/Vazirmatn-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Vazirmatn-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-vazir", 
});

export const metadata: Metadata = {
  title: "CRM صرافی والکس",
  description: "سیستم مدیریت یکپارچه پشتیبانی",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 🌟 suppressHydrationWarning اینجا برای جلوگیری از ارورهای دارک مود الزامی است 🌟
    <html lang="fa" dir="rtl" className={vazirFont.variable} suppressHydrationWarning>
      
      {/* 🌟 رنگ‌های ثابت bg-slate رو برداشتیم و متغیرهای داینامیک گذاشتیم 🌟 */}
      <body className="font-vazir bg-background text-foreground antialiased transition-colors duration-300">
        
        {/* 🌟 مدیریت کننده تم کل سایت 🌟 */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster 
            richColors 
            position="top-center" 
            dir="rtl" 
            theme="system" /* 🌟 تاستر هم با تم سایت سینک می‌شود 🌟 */
            expand={true}
            toastOptions={{
              className: 'font-vazir text-right',
              style: { fontFamily: 'var(--font-vazir)' }
            }} 
          />
          {children}
        </ThemeProvider>

      </body>
    </html>
  );
}