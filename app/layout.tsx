import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Blog Advisor",
  description: "네이버 블로그 성장 분석 파트너",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}