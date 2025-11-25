import { createMemoryRouter } from "react-router";
import MainLayout from "./layouts/MainLayout";
import AgentSettingsTab from "./pages/AISettings/AgentSettingsTab";
import AIModelTab from "./pages/AISettings/AIModelTab";
import AISettingsPage from "./pages/AISettingsPage";
import Automation from "./pages/Automation";
import BrowserSettingsPage from "./pages/BrowserSettingsPage";
import Contact from "./pages/Contact";
import MultiProfileAutomation from "./pages/MultiProfileAutomation";
import MultiProfileAutomationScheduled from "./pages/MultiProfileAutomation/MultiProfileAutomationScheduled";
import MultiProfileAutomationTasks from "./pages/MultiProfileAutomation/MultiProfileAutomationTasks";
import ProfileManagement from "./pages/ProfileManagement";
import WalletManagement from "./pages/WalletManagement";

export const router = createMemoryRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Automation />,
      },
      {
        path: "multi-profile",
        element: <MultiProfileAutomation />,
        children: [
          {
            index: true,
            element: <MultiProfileAutomationTasks />,
          },
          {
            path: "tasks",
            element: <MultiProfileAutomationTasks />,
          },
          {
            path: "scheduled",
            element: <MultiProfileAutomationScheduled />,
          },
        ],
      },
      {
        path: "profile-management",
        element: <ProfileManagement />,
      },
      {
        path: "wallet-management",
        element: <WalletManagement />,
      },
      {
        path: "ai-settings",
        element: <AISettingsPage />,
        children: [
          {
            index: true,
            element: <AIModelTab />,
          },
          {
            path: "model-settings",
            element: <AIModelTab />,
          },
          {
            path: "agent-settings",
            element: <AgentSettingsTab />,
          },
        ],
      },
      {
        path: "browser-settings",
        element: <BrowserSettingsPage />,
      },
      {
        path: "contact",
        element: <Contact />,
      },
    ],
  },
]);
