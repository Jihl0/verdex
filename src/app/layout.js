import { Inter, Roboto } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
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
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${InterFont.variable} ${RobotoFont.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
