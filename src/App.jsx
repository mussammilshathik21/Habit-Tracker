import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  useEffect(() => {
    useAuthStore.getState().init();
  }, []);

  return <AppRoutes />;
}
