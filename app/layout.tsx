import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CustodyMap — Personal Data Atlas",
  description:
    "Synthetic personal-data flow map with retention and access/delete request demos. By Saeed Rumaneh.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
