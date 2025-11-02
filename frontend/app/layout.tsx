import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "FHE Pet Life - Privacy-Preserving Pet Simulation",
  description: "A decentralized pet simulation game with encrypted state management using Zama FHEVM",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen text-white">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900 -z-10"></div>
        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0IDEuNzkxIDQgNCA0IDQtMS43OTEgNC00em0wIDI0YzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0IDEuNzkxIDQgNCA0IDQtMS43OTEgNC00ek0xMiAzNmMtMi4yMDkgMC00LTEuNzkxLTQtNHMxLjc5MS00IDQtNCA0IDEuNzkxIDQgNC0xLjc5MSA0LTQgNHptMjQgMGMtMi4yMDkgMC00LTEuNzkxLTQtNHMxLjc5MS00IDQtNCA0IDEuNzkxIDQgNC0xLjc5MSA0LTQgNHptMTIgMGMtMi4yMDkgMC00LTEuNzkxLTQtNHMxLjc5MS00IDQtNCA0IDEuNzkxIDQgNC0xLjc5MSA0LTQgNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30 -z-10"></div>
        
        <main className="relative flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-12 text-center space-y-4">
            <div className="inline-block">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4">
                <span className="inline-block animate-bounce">🐾</span>
                <span className="gradient-text ml-3">FHE Pet Life</span>
              </h1>
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-purple-300/60">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Powered by Zama FHEVM
            </div>
          </div>
          
          <Providers>{children}</Providers>
          
          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-white/10 text-center text-purple-300/60 text-sm">
            <p>Privacy-First • Blockchain-Powered • Fully Encrypted</p>
          </footer>
        </main>
      </body>
    </html>
  );
}

