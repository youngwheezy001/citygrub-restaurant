"use client"; // Note: we had to change this to a client component to check the URL
import { useEffect } from "react"; 
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header"; 
import { Toaster } from "react-hot-toast"; 
import CartDrawer from "../components/CartDrawer"; 
import { CartProvider } from "../context/CartContext"; 
import { usePathname } from "next/navigation"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  useEffect(() => {
    const handleTabClose = () => {
      // Logic to clear session if desired
    };

    window.addEventListener('beforeunload', handleTabClose);
    return () => window.removeEventListener('beforeunload', handleTabClose);
  }, []);
  
  const isStaffPage = pathname.startsWith("/admin") || 
                      pathname.startsWith("/kitchen") || 
                      pathname.startsWith("/waiter") ||
                      pathname.startsWith("/developer") ||
                      pathname.startsWith("/login");

  return (
    <html lang="en">
      <head>
        {/* FIX: Move metadata icons here since "use client" blocks the metadata export */}
        <title>CityGrub | Just Order It.</title>
        <meta name="description" content="Hot pizzas, juicy burgers, and crispy chicken delivered to your table." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-brand-charcoal text-brand-text`}>
        <CartProvider>
          <Toaster position="bottom-center" /> 
          
          {!isStaffPage && (
            <>
              <Header />
              <CartDrawer />
            </>
          )}

          <main className={`${isStaffPage ? "pt-0" : "pt-24"} min-h-screen pb-12`}>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}