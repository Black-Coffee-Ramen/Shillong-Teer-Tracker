import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import PlayPage from "@/pages/play-page";
import ResultsPage from "@/pages/results-page";
import ProfilePage from "@/pages/profile-page";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AppLayout from "@/components/layout/AppLayout";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        <AppLayout>
          <HomePage />
        </AppLayout>
      </Route>
      <Route path="/play">
        <AppLayout>
          <PlayPage />
        </AppLayout>
      </Route>
      <Route path="/results">
        <AppLayout>
          <ResultsPage />
        </AppLayout>
      </Route>
      <ProtectedRoute 
        path="/profile" 
        component={() => (
          <AppLayout>
            <ProfilePage />
          </AppLayout>
        )}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
