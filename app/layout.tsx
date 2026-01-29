import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Organ Chat - İnsan Anatomisi",
    description: "Yapay zeka destekli interaktif anatomi asistanı.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="tr" className="dark">
            <body className="antialiased bg-black text-white min-h-screen">
                {children}
            </body>
        </html>
    );
}
