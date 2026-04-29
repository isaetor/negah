import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { cn } from "@/lib/utils";

const iranYekanX = localFont({
  src: "./fonts/IRANYekanXVF.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-iranYekanX",
});

export const metadata: Metadata = {
  title: "نگاه | جستجوی ایده‌ها",
  description:
    "نگاه: سایت اشتراک‌گذاری تصاویر، ایده‌های دکوراسیون، مد، آشپزی، هنر و سبک زندگی. الهام بگیرید، کشف کنید و ایده‌های خود را با دیگران به اشتراک بگذارید.",
  // keywords:
  //   "نگاه, اشتراک گذاری تصویر, گالری آنلاین, ایده خلاقانه, دکوراسیون, مد و لباس, آشپزی, هنر دیجیتال",
  // openGraph: {
  //   title: "نگاه - جهان ایده‌ها و تصاویر",
  //   description:
  //     "میلیون‌ها ایده و تصویر خلاقانه در نگاه. الهام بگیرید و ایده‌های خود را share کنید.",
  //   type: "website",
  //   locale: "fa_IR",
  //   siteName: "نگاه",
  //   images: [
  //     {
  //       url: "/og-image.jpg", // بعداً یک عکس پیش‌فرض برای اشتراک‌گذاری قرار بده
  //       width: 1200,
  //       height: 630,
  //       alt: "نگاه - الهام‌بخش ایده‌های جدید",
  //     },
  //   ],
  // },
  // twitter: {
  //   card: "summary_large_image",
  //   title: "نگاه | جستجوی ایده‌ها",
  //   description: "همراه نگاه، دنیایی از تصاویر و الهامات خلاقانه را کشف کنید.",
  //   images: ["/twitter-image.jpg"],
  // },
  // alternates: {
  //   canonical: "https://negah.art", // آدرس اصلی سایتت رو بذار
  // },
  // robots: {
  //   index: true,
  //   follow: true,
  //   googleBot: {
  //     index: true,
  //     follow: true,
  //     "max-video-preview": -1,
  //     "max-image-preview": "large",
  //     "max-snippet": -1,
  //   },
  // },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={cn("h-full", "antialiased", iranYekanX.className)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <DirectionProvider dir="rtl">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
