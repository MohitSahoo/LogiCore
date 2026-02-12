import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { ArrowRight, Shield, BarChart3, Users, Package } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Logo size="lg" />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setLocation('/login')}>
              Sign In
            </Button>
            <Button onClick={() => setLocation('/register')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Streamline Your Supply Chain with LogiCore
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage inventory, track orders, and optimize your supply chain operations with LogiCore's comprehensive management system.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => setLocation('/register')} className="bg-primary hover:bg-primary/90">
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation('/login')}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Inventory Management</h3>
            <p className="text-muted-foreground">
              Track stock levels, manage products, and automate reordering processes.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analytics & Reports</h3>
            <p className="text-muted-foreground">
              Get insights with detailed reports and AI-powered analytics.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Supplier Management</h3>
            <p className="text-muted-foreground">
              Manage supplier relationships and streamline procurement processes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
