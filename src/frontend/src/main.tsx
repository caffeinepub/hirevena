import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import "../index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const AdminLogin = lazy(() => import("./AdminLogin"));
const AdminDashboard = lazy(() => import("./AdminDashboard"));

const queryClient = new QueryClient();

// Simple client-side router
type Route = "home" | "admin-login" | "admin-dashboard";

function getInitialRoute(): Route {
  const path = window.location.pathname;
  if (path.startsWith("/admin/dashboard")) {
    return "admin-dashboard";
  }
  if (path.startsWith("/admin")) {
    return "admin-login";
  }
  return "home";
}

function AppRouter() {
  const [route, setRoute] = useState<Route>(getInitialRoute);

  // Sync URL to route
  useEffect(() => {
    const handlePopState = () => {
      setRoute(getInitialRoute());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (to: string, r: Route) => {
    window.history.pushState({}, "", to);
    setRoute(r);
  };

  // Auth guard for dashboard
  useEffect(() => {
    if (route === "admin-dashboard") {
      const isAuth = localStorage.getItem("hirevena_admin_auth") === "true";
      if (!isAuth) {
        window.history.pushState({}, "", "/admin");
        setRoute("admin-login");
      }
    }
  }, [route]);

  if (route === "admin-login") {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
        <AdminLogin
          onLoginSuccess={() => navigate("/admin/dashboard", "admin-dashboard")}
        />
      </Suspense>
    );
  }

  if (route === "admin-dashboard") {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
        <AdminDashboard
          onLogout={() => {
            localStorage.removeItem("hirevena_admin_auth");
            navigate("/admin", "admin-login");
          }}
        />
      </Suspense>
    );
  }

  // Default: main website
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <AppRouter />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
