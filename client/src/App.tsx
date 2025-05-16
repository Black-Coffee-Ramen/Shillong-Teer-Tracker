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
import Chat from "@/pages/Chat";
import Support from "@/pages/Support";
import Admin from "@/pages/Admin";
import { AuthProvider } from "@/hooks/use-auth";
import { SocketProvider } from "@/hooks/use-socket";
import { NotificationProvider } from "@/hooks/use-notification";
import { NotificationContainer } from "@/components/ui/notification";
import { ProtectedRoute } from "@/lib/protected-route";
import AppLayout from "@/components/layout/AppLayout";
import AudioFiles from "@/components/audio/AudioFiles";
import OfflineDetector from "@/components/common/OfflineDetector";
import OfflineIndicator from "@/components/common/OfflineIndicator";

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
      <ProtectedRoute 
        path="/chat" 
        component={() => (
          <AppLayout>
            <Chat />
          </AppLayout>
        )}
      />
      <Route path="/support">
        <AppLayout>
          <Support />
        </AppLayout>
      </Route>
      <ProtectedRoute 
        path="/admin" 
        component={() => (
          <AppLayout>
            <Admin />
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
        <SimpleSocketProvider>
          <NotificationProvider>
            <Router />
            <AudioFiles />
            <NotificationContainer />
            <OfflineDetector />
            <OfflineIndicator />
            <Toaster />
          </NotificationProvider>
        </SimpleSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
