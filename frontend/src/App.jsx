import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import useAuthStore from "./store/authStore";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Problems from "./pages/Problems";
import Flashcards from "./pages/Flashcards";
import Plan from "./pages/Plan";
import Mock from "./pages/Mock";
import Settings from "./pages/Settings";
import { PageWrapper } from "./components/PageWrapper";

export default function App() {
  const { loading } = useAuthStore();

  useEffect(() => {
    // Initialize auth listener
    useAuthStore.getState().initAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function AppRoutes() {
  const { user } = useAuthStore();
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/dashboard" replace /> : <Signup />}
      />
      <Route
        path="/dashboard"
        element={
          user ? (
            <PageWrapper>
              <Dashboard />
            </PageWrapper>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/problems"
        element={
          user ? (
            <PageWrapper>
              <Problems />
            </PageWrapper>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/flashcards"
        element={
          user ? (
            <PageWrapper>
              <Flashcards />
            </PageWrapper>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/plan"
        element={
          user ? (
            <PageWrapper>
              <Plan />
            </PageWrapper>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/mock"
        element={
          user ? (
            <PageWrapper>
              <Mock />
            </PageWrapper>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/settings"
        element={
          user ? (
            <PageWrapper>
              <Settings />
            </PageWrapper>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
