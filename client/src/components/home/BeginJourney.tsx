import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function BeginJourney() {
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="py-16 px-4 bg-amber-50">
      <div className="container mx-auto max-w-5xl text-center">
        <h2 className="font-cinzel text-2xl md:text-4xl font-bold text-brown-dark mb-4">Ready to Begin Your Journey?</h2>
        <p className="text-gray-700 max-w-3xl mx-auto mb-8">Join our community of passionate readers and writers. Discover new worlds, share your stories, and connect with like-minded storytellers.</p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <Button asChild className="bg-brown-dark hover:bg-amber-500 text-amber-50 font-cinzel py-3 px-8 rounded-md transition-colors">
              <Link href="/publish">Start Writing</Link>
            </Button>
          ) : (
            <Button asChild className="bg-brown-dark hover:bg-amber-500 text-amber-50 font-cinzel py-3 px-8 rounded-md transition-colors">
              <Link href="/register">Create Account</Link>
            </Button>
          )}
          
          <Button asChild variant="outline" className="bg-transparent border-2 border-amber-500 hover:bg-amber-500 text-brown-dark hover:text-amber-50 font-cinzel py-3 px-8 rounded-md transition-colors">
            <Link href="/originals">Explore Stories</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
