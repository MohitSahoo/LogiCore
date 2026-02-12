import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Suppliers from "./pages/Suppliers";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Reports from "./pages/Reports";
import AIReports from "./pages/AIReports";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";


function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path={"/admin"} component={() => <ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path={"/products"} component={() => <ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path={"/products/:id"} component={() => <ProtectedRoute><ProductDetail /></ProtectedRoute>} />
      <Route path={"/suppliers"} component={() => <ProtectedRoute><Suppliers /></ProtectedRoute>} />
      <Route path={"/orders"} component={() => <ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path={"/orders/:id"} component={() => <ProtectedRoute><OrderDetail /></ProtectedRoute>} />
      <Route path={"/reports"} component={() => <ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path={"/ai-reports"} component={() => <ProtectedRoute><AIReports /></ProtectedRoute>} />
      <Route path={"/profile"} component={() => <ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
