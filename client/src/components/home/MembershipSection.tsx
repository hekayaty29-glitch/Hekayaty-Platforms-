import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Check, Gift } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MembershipSection() {
  const { user, isAuthenticated, upgradeToPremium } = useAuth();
  const { isVip } = useRoles();
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  const handleUpgrade = async () => {
    await upgradeToPremium();
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    
    setIsRedeeming(true);
    try {
      // In a real app, you would validate the promo code with your backend
      // For now, we'll simulate a successful redemption
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate a successful redemption
      if (promoCode.toUpperCase() === 'HEKAPREMIUM') {
        await upgradeToPremium();
        toast.success('Promo code applied successfully! Premium access granted.');
        setPromoCode('');
      } else {
        toast.error('Invalid or expired promo code');
      }
    } catch (error) {
      toast.error('Failed to apply promo code. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };
  
  return (
    <section className="py-20 px-4 text-slate-100" style={{ backgroundColor: '#151008' }}>
      <div className="container mx-auto max-w-6xl">
        <h2 className="font-cinzel text-3xl md:text-4xl font-bold mb-4 text-center tracking-wide">Unlock Your Creative Potential</h2>
        <p className="text-center mb-12 max-w-3xl mx-auto font-cormorant text-xl italic text-slate-300">Choose the membership that fits your storytelling journey.</p>
        
        {/* Redeem Code Section */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10 mb-8 max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="bg-amber-800 p-3 rounded-full mb-4">
              <Gift className="h-8 w-8 text-yellow-300" />
            </div>
            <h3 className="font-cinzel text-2xl font-semibold mb-3">Have a Promo Code?</h3>
            <p className="text-slate-300 mb-4 max-w-md">Enter your code below to unlock premium features</p>
            
            <form onSubmit={handleRedeemCode} className="w-full max-w-md flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter promo code"
                className="flex-1 px-4 py-2 rounded-md border border-white/20 bg-white/10 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                disabled={isRedeeming || (isAuthenticated && isVip)}
              />
              <Button 
                type="submit" 
                disabled={!promoCode.trim() || isRedeeming || (isAuthenticated && isVip)}
                className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-cinzel font-semibold"
              >
                {isRedeeming ? 'Applying...' : 'Redeem'}
              </Button>
            </form>
            
            {isAuthenticated && isVip && (
              <p className="text-green-400 text-sm mt-2">You already have premium access!</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10">
            <div className="text-center mb-6">
              <h3 className="font-cinzel text-2xl font-bold mb-2">The Traveler</h3>
              <p className="text-lg font-cormorant">Embark on your adventure</p>
              <p className="text-3xl font-bold mt-4">$0</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>Contains ads</span>
              </li>
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>Download up to 2 novels per month</span>
              </li>
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>Access to community forums</span>
              </li>
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>Reader comments & feedback</span>
              </li>
            </ul>
            
            {isAuthenticated ? (
              isVip ? (
                <Button disabled className="w-full bg-amber-500 text-amber-50 font-cinzel py-3 rounded-md">
                  Current Plan
                </Button>
              ) : (
                <Button disabled className="w-full bg-slate-700 hover:bg-slate-600 text-white font-cinzel py-3 rounded-md transition-colors">
                  Current Plan
                </Button>
              )
            ) : (
              <Button asChild className="w-full bg-slate-700 hover:bg-slate-600 text-white font-cinzel py-3 rounded-md transition-colors">
                <Link href="/register">Get Started</Link>
              </Button>
            )}
          </div>
          
          {/* Premium Tier */}
          <div className="bg-yellow-500/10 backdrop-blur-md rounded-xl p-8 border border-yellow-400 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-amber-800 text-amber-50 px-4 py-1 rounded-full text-sm font-bold">
              MOST POPULAR
            </div>
            
            <div className="text-center mb-6">
              <h3 className="font-cinzel text-2xl font-bold mb-2">Lord of the Castle</h3>
              <p className="text-lg font-cormorant">Rule the literary realm</p>
              <p className="text-3xl font-bold mt-4">$4.99<span className="text-sm font-normal">/month</span></p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>No ads</span>
              </li>
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>Early access to new novels & stories</span>
              </li>
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>Exclusive novels</span>
              </li>
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>Download up to 5 novels a month</span>
              </li>
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>Promote subscribers' published novels</span>
              </li>
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>Special subscriber forums & clubs</span>
              </li>
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>Special badges</span>
              </li>
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>Exclusive offers in store</span>
              </li>
              <li className="flex items-start">
                <Check className="text-yellow-400 mt-1 mr-2 h-4 w-4" />
                <span>Exclusive events</span>
              </li>
            </ul>
            
            {isAuthenticated ? (
              isVip ? (
                <Button disabled className="w-full bg-yellow-500 text-slate-900 font-cinzel py-3 rounded-md transition-colors font-bold">
                  Current Plan
                </Button>
              ) : (
                <Button 
                  onClick={handleUpgrade}
                  className="w-full bg-amber-200 hover:bg-yellow-600 text-slate-900 font-cinzel py-3 rounded-md transition-colors font-bold"
                >
                  Upgrade Now
                </Button>
              )
            ) : (
              <Button asChild className="w-full bg-amber-200 hover:bg-yellow-600 text-slate-900 font-cinzel py-3 rounded-md transition-colors font-bold">
                <Link href="/subscribe">Upgrade Now</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
