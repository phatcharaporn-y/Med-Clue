import "./globals.css";
import type { ReactNode } from "react";
import { Prompt } from "next/font/google";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-prompt",
});

export const metadata = {
  title: "MedClue",
  description: "บทเรียนและเกมจำลองสถานการณ์ทางการแพทย์",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className={prompt.variable}>
      <body>{children}</body>
    </html>
  );
}
