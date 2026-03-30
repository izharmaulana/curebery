import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AuthPage from "@/pages/auth";
import PatientDashboard from "@/pages/patient-dashboard";
import NurseDashboard from "@/pages/nurse-dashboard";
import NurseRegisterPage from "@/pages/nurse-register";
import PatientRegisterPage from "@/pages/patient-register";
import ChatPage from "@/pages/chat";
import TrackingPage from "@/pages/tracking";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/patient-dashboard" component={PatientDashboard} />
      <Route path="/nurse-dashboard" component={NurseDashboard} />
      <Route path="/nurse-register" component={NurseRegisterPage} />
      <Route path="/patient-register" component={PatientRegisterPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/tracking" component={TrackingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
