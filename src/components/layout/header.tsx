"use client";

import { 
  Bell, Search, Menu, Building2, ShieldCheck, 
  ArrowLeftRight, LayoutDashboard, Check, ChevronDown,
  MessageSquare, UserCircle, LogOut, Settings, Wallet, Leaf, Plus
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getInitials, getLevelInfo, cn } from "@/lib/utils";

interface Association {
  id: string;
  name: string;
  color: string;
}

interface HeaderProps {
  onMobileMenuOpen: () => void;
  title?: string;
}

export function Header({ onMobileMenuOpen, title }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const pathname = usePathname();
  const router = useRouter();
  const levelInfo = user?.level ? getLevelInfo(user.level) : null;

  const [associations, setAssociations] = useState<Association[]>([]);
  const [selectedAssoc, setSelectedAssoc] = useState<Association | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Détection de l'association courante dans l'URL
  const assocMatch = pathname.match(/^\/associations\/([^/]+)(?:\/|$)/);
  const currentAssocId = assocMatch?.[1];

  useEffect(() => {
    fetch("/api/associations")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.associations) {
          setAssociations(data.associations);
          if (currentAssocId) {
            const found = data.associations.find((a: any) => a.id === currentAssocId);
            if (found) setSelectedAssoc(found);
          }
        }
      })
      .catch(() => {});

    // Fetch Wallet Balance
    if (session) {
      fetch("/api/wallet")
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.wallet) {
            setWalletBalance(data.wallet.balance);
          }
        })
        .catch(() => {});
    }
  }, [currentAssocId, session]);

  const handleSelectAssoc = (assoc: Association | null) => {
    setSelectedAssoc(assoc);
    setIsSelectorOpen(false);
    if (assoc) {
      router.push(`/associations/${assoc.id}`);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <header className="h-16 bg-cream/95 backdrop-blur-xl border-b border-stone sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
      
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMobileMenuOpen} 
          className="lg:hidden p-2 rounded-lg text-charcoal hover:bg-stone transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center bg-warm-white border border-stone rounded-xl px-3 py-2 w-64">
          <Search className="w-4 h-4 text-ash mr-2" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="bg-transparent text-sm font-body text-charcoal placeholder:text-ash outline-none w-full"
          />
        </div>
      </div>

      {/* Center: Association Selector */}
      <div className="flex-1 flex items-center justify-start md:justify-center relative">
        <button 
          onClick={() => setIsSelectorOpen(!isSelectorOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-warm-white border border-stone hover:bg-cream transition-colors"
        >
          {selectedAssoc && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedAssoc.color }}
            />
          )}
          <span className="font-body text-sm font-medium text-charcoal truncate max-w-[140px]">
            {selectedAssoc ? selectedAssoc.name : "Choisir une association"}
          </span>
          <ChevronDown className={cn("w-4 h-4 text-ash transition-transform", isSelectorOpen && "rotate-180")} />
        </button>

        {/* Dropdown Selector */}
        {isSelectorOpen && (
          <div className="absolute top-full left-0 md:left-1/2 md:-translate-x-1/2 mt-2 w-72 bg-warm-white border border-stone rounded-2xl shadow-lg z-50 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-stone">
              <h3 className="font-heading text-sm font-semibold text-charcoal">Mes Associations</h3>
            </div>
            
            <button 
              onClick={() => handleSelectAssoc(null)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-cream transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-ash" />
              <span className="font-body text-sm text-charcoal">Vue Globale</span>
              {!selectedAssoc && <Check className="w-4 h-4 text-forest ml-auto" />}
            </button>
            
            <div className="max-h-60 overflow-y-auto">
              {associations.map(assoc => (
                <button 
                  key={assoc.id}
                  onClick={() => handleSelectAssoc(assoc)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-cream transition-colors"
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: assoc.color }}
                  />
                  <span className="font-body text-sm text-charcoal truncate">{assoc.name}</span>
                  {selectedAssoc?.id === assoc.id && <Check className="w-4 h-4 text-forest ml-auto" />}
                </button>
              ))}
            </div>

            <div className="border-t border-stone px-4 py-2">
              <Link 
                href="/associations/new"
                onClick={() => setIsSelectorOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-medium text-forest hover:text-forest-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                Créer une association
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Chat Button */}
        <Link href="/chat" className="relative p-2 rounded-xl text-graphite hover:bg-stone transition-colors group">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-forest border-2 border-cream" />
        </Link>

        {/* Wallet Shortcut */}
        <Link href="/dashboard/wallet" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-warm-white border border-stone hover:bg-cream transition-colors">
          <Wallet className="w-4 h-4 text-forest" />
          <span className="font-body text-sm font-medium text-charcoal">
            {walletBalance !== null ? `${walletBalance.toLocaleString("fr-FR")} F` : "..."}
          </span>
        </Link>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-graphite hover:bg-stone transition-colors group">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error border-2 border-cream" />
        </button>
        
        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-stone transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center font-heading text-sm font-semibold">
              {getInitials(user?.name || "U")}
            </div>
            <ChevronDown className={cn("w-4 h-4 text-ash transition-transform hidden sm:block", isUserMenuOpen && "rotate-180")} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-warm-white border border-stone rounded-2xl shadow-lg z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-stone">
                <p className="font-heading text-sm font-semibold text-charcoal">
                  {user?.name}
                </p>
                <p className="font-body text-xs text-ash">{user?.email}</p>
              </div>

              <Link href="/profil" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-body text-graphite hover:bg-cream transition-colors">
                <UserCircle className="w-4 h-4" /> Profil
              </Link>
              
              <Link href="/parametres" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-body text-graphite hover:bg-cream transition-colors">
                <Settings className="w-4 h-4" /> Paramètres
              </Link>

              {user?.systemRoleId && (
                <Link href="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-body text-graphite hover:bg-cream transition-colors">
                  <ShieldCheck className="w-4 h-4" /> Console Admin
                </Link>
              )}

              <div className="border-t border-stone">
                <button 
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body text-error hover:bg-error/5 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
