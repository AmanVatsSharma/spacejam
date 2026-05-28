import './globals.css';

export const metadata = {
  title: 'SpaceJam - Coworking Space Management',
  description: 'Manage your coworking space efficiently',
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
