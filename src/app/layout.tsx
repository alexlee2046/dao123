import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-inter",
// });

export const metadata: Metadata = {
  title: "dao123 - AI 网站构建器",
  description: "秒级生成 AI 网站。",
};

// 根布局 - 委托给 [locale] 布局处理
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

