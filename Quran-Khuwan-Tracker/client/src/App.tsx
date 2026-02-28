import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import OrganizerLogin from "@/pages/organizer-login";
import OrganizerDashboard from "@/pages/organizer-dashboard";
import ParticipantView from "@/pages/participant-view";

function Router() {
  return (
    <Switch>
      <Route path="/" component={OrganizerLogin} />
      <Route path="/organizer/login" component={OrganizerLogin} />
      <Route path="/organizer/dashboard" component={OrganizerDashboard} />
      <Route path="/k/:slug" component={ParticipantView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
