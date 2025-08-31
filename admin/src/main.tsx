import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "../../client/src/components/ui/toaster"; // reuse component
import { AuthProvider } from "../../client/src/lib/auth";
import { AdminProvider } from "../../client/src/context/AdminContext";
import AdminDashboardPage from "../../client/src/pages/AdminDashboardPage";
import "../../client/src/index.css"; // tailwind styles from main app

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminProvider>
        <AdminDashboardPage />
        <Toaster />
              </AdminProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
