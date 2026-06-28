/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { ThemeProvider } from "./components/theme-provider";
import { UserProvider } from "./context/UserContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import Layout from "./components/layout";
import Dashboard from "./pages/dashboard";
import Tasks from "./pages/tasks";
import Training from "./pages/training";
import Character from "./pages/character";
import Profile from "./pages/profile";
import Landing from "./pages/landing";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Calendar from "./pages/calendar";
import RealitySync from "./pages/reality-sync";
import RiskCenter from "./pages/risk-center";
import RecoveryMissions from "./pages/recovery-missions";
import Workspaces from "./pages/workspaces";
import AnalyticsView from "./pages/analytics";
import Leaderboard from "./pages/leaderboard";
import { GlobalTimer } from "./components/GlobalTimer";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* App Shell / Authenticated Area */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="workspaces" element={<Workspaces />} />
          <Route path="reality-sync" element={<RealitySync />} />
          <Route path="risk-center" element={<RiskCenter />} />
          <Route path="recovery" element={<RecoveryMissions />} />
          <Route path="analytics" element={<AnalyticsView />} />
          <Route path="training" element={<Training />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="character" element={<Character />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Catch All redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="focusforge-theme">
      <UserProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <AnimatedRoutes />
            <GlobalTimer />
          </BrowserRouter>
        </WorkspaceProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
