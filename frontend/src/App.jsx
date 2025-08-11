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
import Home from "./pages/Home";

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
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/home" replace /> : <Login />} //if user is logged in, redirect to home
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/home" replace /> : <Signup />} //if user is logged in, redirect to home
        />
        <Route
          path="/home"
          element={user ? <Home /> : <Navigate to="/login" replace />} //if user is not logged in, redirect to login
        />
      </Routes>
    </Router>
  );
}

export default App;
