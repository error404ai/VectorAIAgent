import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { RouterProvider } from "react-router";
import "./App.css";
import AuthProvider from "./components/AuthProvider";
import { router } from "./routes";
import { store } from "./store/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </Provider>
  </StrictMode>,
);
