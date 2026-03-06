import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexoNet Argentina",
  description: "Conectando Oportunidades - Conectando a la Comunidad",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Nunito', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
