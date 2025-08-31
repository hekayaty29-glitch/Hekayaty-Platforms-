import { createRoot } from "react-dom/client";
import App from "./App";

// DEV-ONLY: auto sign-in helper
if (import.meta.env.DEV && !localStorage.getItem("hekayaty_user")) {
  localStorage.setItem(
    "hekayaty_user",
    JSON.stringify({
      id: "dev-123",
      email: "vip@test.com",
      name: "VIP Tester",
      isPremium: true,
    })
  );
}
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
