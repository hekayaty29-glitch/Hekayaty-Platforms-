import { Link } from "wouter";
import { Facebook } from "lucide-react";
import { MessageSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-midnight-blue text-amber-50 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: About */}
          <div>
            <h3 className="font-cinzel text-xl font-bold mb-4">HEKAYATY</h3>
            <p className="text-sm mb-4 text-gray-300">A magical platform for readers and writers to connect, create, and explore endless worlds of imagination.</p>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/profile.php?id=61577990000626" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-amber-50 hover:text-amber-500 transition-colors"
                aria-label="Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@hekayaty11?_t=ZS-8z0lNZI2Caw&_r=1" target="_blank" rel="noopener noreferrer" className="text-amber-50 hover:text-pink-500 transition-colors" aria-label="TikTok">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.87 5.58c-.5 4.3 3.53 7.44 7.37 6.57c3.24-.73 5.52-3.85 4.88-7.11z"></path>
                </svg>
              </a>
              <a href="https://www.instagram.com/hekayaty_ma?igsh=MWRmZ2R2bHQyM256cA==" target="_blank" rel="noopener noreferrer" className="text-amber-50 hover:text-purple-500 transition-colors" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a 
                href="https://www.youtube.com/@Hekayaty-q2i" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#FF0000] hover:opacity-80 transition-opacity"
                aria-label="YouTube"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Column 2: Explore */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-4">Explore</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/originals" className="hover:text-amber-500 transition-colors">Hekayaty World</Link>
              </li>
              <li>
                <Link href="/top-rated" className="hover:text-amber-500 transition-colors">Top Rated</Link>
              </li>
              <li>
                <Link href="/originals" className="hover:text-amber-500 transition-colors">Hekayaty Originals</Link>
              </li>
              <li>
                <Link href="/characters" className="hover:text-amber-500 transition-colors">Hekayaty Characters</Link>
              </li>
              <li>
                <Link href="/talecraft" className="hover:text-amber-500 transition-colors">TaleCraft</Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-amber-500 transition-colors">Community</Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Support */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/contact" className="hover:text-amber-500 transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-500 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="hover:text-amber-500 transition-colors">Community Guidelines</Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} HEKAYATY. All rights reserved. A magical realm for storytellers and dreamers.</p>
        </div>
      </div>
    </footer>
  );
}
