import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart3, History, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">EOD Options Analyzer</h1>
                <p className="text-sm text-muted-foreground">NSE Options Chain Analysis Tool</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Link
                to="/history"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="font-medium">History</span>
              </Link>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-foreground">Welcome to Options Analyzer</h2>
            <p className="text-lg text-muted-foreground">
              Analyze NSE Options Chain data and get trading insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Entry Card */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Edit className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">Manual Entry</h3>
                <p className="text-muted-foreground">
                  Enter option chain data manually for quick analysis
                </p>
                <Link to="/manual-entry" className="w-full">
                  <Button className="w-full" size="lg">
                    Start Manual Entry
                  </Button>
                </Link>
              </div>
            </Card>

            {/* History Card */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-secondary/10">
                  <History className="w-12 h-12 text-secondary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">Analysis History</h3>
                <p className="text-muted-foreground">
                  View and manage your saved analysis reports
                </p>
                <Link to="/history" className="w-full">
                  <Button variant="secondary" className="w-full" size="lg">
                    View History
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Features Section */}
          <div className="mt-12 pt-12 border-t border-border">
            <h3 className="text-2xl font-semibold text-foreground mb-6 text-center">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="text-4xl">📊</div>
                <h4 className="font-semibold text-foreground">Comprehensive Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  ATM detection, PCR calculation, support/resistance zones
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl">🎯</div>
                <h4 className="font-semibold text-foreground">Strategy Suggestions</h4>
                <p className="text-sm text-muted-foreground">
                  Get automated trading strategy recommendations
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl">💾</div>
                <h4 className="font-semibold text-foreground">Save & Export</h4>
                <p className="text-sm text-muted-foreground">
                  Save analysis history and export reports as PDF/JSON
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
