import { Inter, Roboto } from "next/font/google";
import "./globals.css";

const InterFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const RobotoFont = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata = {
  title: "Verdex",
  description: "Web-based Seed Data Profile System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${InterFont.variable} ${RobotoFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
