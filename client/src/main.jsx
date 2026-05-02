import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import App from "./App";
import "./index.css";
import useThemeStore from "./stores/themeStore";

// Apply saved theme before React renders (prevents flash)
useThemeStore.getState().init();

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-right" />
    </QueryClientProvider>
  </React.StrictMode>,
);
