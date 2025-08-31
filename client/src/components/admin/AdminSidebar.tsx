import { Link, useLocation } from "wouter";
import { Users, MessageSquareText, Calendar, GalleryHorizontal, Newspaper, CircleUserRound, Award } from "lucide-react";

const links = [
  { href: "/admin/analytics", label: "Analytics", icon: Users },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/comments", label: "Comments", icon: MessageSquareText },
  { href: "/admin/reports", label: "Reports", icon: MessageSquareText },
  { href: "/admin/workshops", label: "Workshops", icon: Calendar },
  { href: "/admin/clubs", label: "Clubs", icon: CircleUserRound },
  { href: "/admin/galleries", label: "Galleries", icon: GalleryHorizontal },
  { href: "/admin/subscription-codes", label: "Codes", icon: Newspaper },
  { href: "/admin/payments", label: "Payments", icon: Newspaper },
  { href: "/admin/hall-of-quills", label: "Hall of Quills", icon: Award },
  { href: "/admin/ads", label: "Sponsored Ads", icon: Newspaper },
  { href: "/admin/community-news", label: "Community News", icon: Newspaper },
  { href: "/admin/main-news", label: "Hekayaty News", icon: Newspaper },
];

export default function AdminSidebar() {
  const [location] = useLocation();
  return (
    <aside className="w-64 bg-amber-950 text-amber-50 min-h-screen p-4 space-y-6">
      <h2 className="text-2xl font-cinzel font-bold">Admin</h2>
      <nav className="flex flex-col gap-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = location.startsWith(href);
          return (
            <Link key={href} href={href} className={`inline-flex items-center gap-3 px-3 py-2 rounded hover:bg-amber-800 ${active ? "bg-amber-700" : ""}`}> 
              <Icon className="h-5 w-5" /> <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
