import React, { Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ThemeProvider from "./theme/ThemeProvider";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Unauthorized from "./components/Unauthorized";

// Lazy load components
const TraineeDashboard = React.lazy(
  () => import("./components/dashboard/trainee/TraineeDashboard"),
);
const TrainingPlanPage = React.lazy(
  () => import("./components/dashboard/trainee/TrainingPlanPage"),
);
const TrainingPlanDetailsPage = React.lazy(
  () => import("./components/dashboard/trainee/TrainingPlanDetailsPage"),
);
const PlaybackPage = React.lazy(
  () => import("./components/dashboard/trainee/PlaybackPage"),
);
const PlaybackDetailPage = React.lazy(
  () => import("./components/dashboard/trainee/playback/PlaybackDetailPage"),
);
const ManageSimulationsPage = React.lazy(
  () => import("./components/dashboard/trainee/manage/ManageSimulationsPage"),
);
const GenerateScript = React.lazy(
  () => import("./components/dashboard/trainee/manage/generate/GenerateScript"),
);
const SimulationAttemptPage = React.lazy(
  () => import("./components/dashboard/trainee/SimulationAttemptPage"),
);
const ManageTrainingPlanPage = React.lazy(
  () => import("./components/dashboard/trainee/manage/ManageTrainingPlanPage"),
);
const AssignSimulationsPage = React.lazy(
  () => import("./components/dashboard/trainee/AssignSimulationsPage"),
);

// Component to handle workspace ID from URL
const WorkspaceHandler: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();

  useEffect(() => {
    // Log the workspace ID from URL for debugging
    const params = new URLSearchParams(location.search);
    const workspaceId = params.get("workspace_id");
    if (workspaceId) {
      console.log("Workspace ID detected in URL:", workspaceId);
    }
  }, [location.search]);

  return <>{children}</>;
};

// Component to handle the root redirect with workspace ID preservation
const RootRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const workspaceId = params.get("workspace_id");

    // Redirect to dashboard with workspace ID if present
    const target = workspaceId
      ? `/dashboard?workspace_id=${encodeURIComponent(workspaceId)}`
      : "/dashboard";

    navigate(target, { replace: true });
  }, [location, navigate]);

  return <LoadingSpinner />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <WorkspaceHandler>
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  {/* Default redirect - now preserves workspace ID */}
                  <Route path="/" element={<RootRedirect />} />

                  {/* Protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute path="/dashboard">
                        <TraineeDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/training"
                    element={
                      <ProtectedRoute path="/training">
                        <TrainingPlanPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/training/:id"
                    element={
                      <ProtectedRoute path="/training">
                        <TrainingPlanDetailsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/playback"
                    element={
                      <ProtectedRoute path="/playback">
                        <PlaybackPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/playback/:id"
                    element={
                      <ProtectedRoute path="/playback">
                        <PlaybackDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manage-simulations"
                    element={
                      <ProtectedRoute path="/manage-simulations">
                        <ManageSimulationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/generate-scripts"
                    element={
                      <ProtectedRoute path="/manage-simulations">
                        <GenerateScript />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/generate-scripts/:id"
                    element={
                      <ProtectedRoute path="/manage-simulations">
                        <GenerateScript />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/simulation/:id/:assignment_id/attempt"
                    element={
                      <ProtectedRoute path="/training">
                        <SimulationAttemptPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manage-training-plan"
                    element={
                      <ProtectedRoute path="/manage-training-plan">
                        <ManageTrainingPlanPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assign-simulations"
                    element={
                      <ProtectedRoute path="/assign-simulations">
                        <AssignSimulationsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch all - redirect to dashboard with workspace ID preservation */}
                  <Route path="*" element={<RootRedirect />} />
                </Routes>
              </Suspense>
            </Layout>
          </WorkspaceHandler>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
