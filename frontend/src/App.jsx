import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
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

function App() {
  const { user, loading } = useAuthStore();

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
      <Routes>
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
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} //if user is logged in, redirect to/dashboard
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/dashboard" replace /> : <Signup />} //if user is logged in, redirect to/dashboard
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} //if user is not logged in, redirect to login
        />
        <Route
          path="/problems"
          element={user ? <Problems /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/flashcards"
          element={user ? <Flashcards /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/plan"
          element={user ? <Plan /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/mock"
          element={user ? <Mock /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
