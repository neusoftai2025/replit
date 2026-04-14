import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "./components/auth-context";
import { AppLayout } from "./components/layout";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import RoomsList from "@/pages/rooms";
import RoomDetail from "@/pages/rooms/room-detail";
import ReservationsList from "@/pages/reservations/index";
import NewReservation from "@/pages/reservations/new";
import AdminRooms from "@/pages/admin/rooms";
import CalendarView from "@/pages/calendar";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (!user) {
    return null; // AuthProvider handles redirect to /login
  }

  if (adminOnly && user.role !== "admin") {
    return <NotFound />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      
      <Route path="/rooms">
        {() => <ProtectedRoute component={RoomsList} />}
      </Route>
      
      <Route path="/rooms/:id">
        {() => <ProtectedRoute component={RoomDetail} />}
      </Route>

      <Route path="/reservations">
        {() => <ProtectedRoute component={ReservationsList} />}
      </Route>

      <Route path="/reservations/new">
        {() => <ProtectedRoute component={NewReservation} />}
      </Route>

      <Route path="/calendar">
        {() => <ProtectedRoute component={CalendarView} />}
      </Route>

      <Route path="/admin/rooms">
        {() => <ProtectedRoute component={AdminRooms} adminOnly={true} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
