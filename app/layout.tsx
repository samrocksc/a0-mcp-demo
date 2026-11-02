export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#fff", color: "#111" }}>{children}</body>
    </html>
  );
}