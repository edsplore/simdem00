import React, { Suspense, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ThemeProvider from './theme/ThemeProvider';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

const UnauthorizedPage = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Unauthorized Access</h1>
        <p className="text-gray-600">You don't have permission to access this page.</p>
        {user && (
          <p className="text-gray-500 mt-2">
            Current role: {user.role}
          </p>
        )}
      </div>
    </div>
  );
};

const TraineeDashboard = React.lazy(() =>
  import('./components/dashboard/trainee/TraineeDashboard')
);
const TrainingPlanPage = React.lazy(() =>
  import('./components/dashboard/trainee/TrainingPlanPage')
);
const TrainingPlanDetailsPage = React.lazy(() =>
  import('./components/dashboard/trainee/TrainingPlanDetailsPage')
);
const PlaybackPage = React.lazy(() =>
  import('./components/dashboard/trainee/PlaybackPage')
);
const PlaybackDetailPage = React.lazy(() =>
  import('./components/dashboard/trainee/playback/PlaybackDetailPage')
);
const ManageSimulationsPage = React.lazy(() =>
  import('./components/dashboard/trainee/manage/ManageSimulationsPage')
);
const GenerateScript = React.lazy(() =>
  import('./components/dashboard/trainee/manage/generate/GenerateScript')
);
const SimulationAttemptPage = React.lazy(() =>
  import('./components/dashboard/trainee/SimulationAttemptPage')
);
const ManageTrainingPlanPage = React.lazy(() =>
  import('./components/dashboard/trainee/manage/ManageTrainingPlanPage')
);
const AssignSimulationsPage = React.lazy(() =>
  import('./components/dashboard/trainee/AssignSimulationsPage')
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route
                  path="/unauthorized"
                  element={<UnauthorizedPage />}
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['trainee', 'manager', 'creator', 'org_admin', 'workspace_admin']} path="/dashboard">
                      <TraineeDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/training"
                  element={
                    <ProtectedRoute allowedRoles={['trainee', 'manager', 'creator', 'org_admin', 'workspace_admin']} path="/training">
                      <TrainingPlanPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/training/:id"
                  element={
                    <ProtectedRoute allowedRoles={['trainee', 'manager', 'creator', 'org_admin', 'workspace_admin']} path="/training">
                      <TrainingPlanDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/playback"
                  element={
                    <ProtectedRoute allowedRoles={['trainee', 'manager', 'creator', 'org_admin']} path="/playback">
                      <PlaybackPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/playback/:id"
                  element={
                    <ProtectedRoute allowedRoles={['trainee', 'manager', 'creator', 'org_admin', 'workspace_admin']} path="/playback">
                      <PlaybackDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manage-simulations"
                  element={
                    <ProtectedRoute allowedRoles={['creator', 'workspace_admin']} path="/manage-simulations">
                      <ManageSimulationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/generate-scripts"
                  element={
                    <ProtectedRoute allowedRoles={['creator', 'workspace_admin']} path="/manage-simulations">
                      <GenerateScript />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/simulation/:id/attempt" 
                  element={
                     <ProtectedRoute allowedRoles={['trainee', 'manager', 'creator', 'org_admin', 'workspace_admin']} path="/training">
                      <SimulationAttemptPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/manage-training-plan" 
                  element={
                     <ProtectedRoute allowedRoles={['creator', 'workspace_admin']} path="/manage-training-plan">
                      <ManageTrainingPlanPage />
                    </ProtectedRoute>
                  } 
                />
                <Route
                  path="/assign-simulations"
                  element={
                    <ProtectedRoute allowedRoles={['manager', 'creator', 'workspace_admin']} path="/assign-simulations">
                      <AssignSimulationsPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </Layout>
        </Router>        
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;