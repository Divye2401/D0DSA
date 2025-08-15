import { useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../utils/supabaseclient";
import Spinner from "../components/general/Spinner";
import icon48 from "../assets/icon48.png";

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    leetcodeUsername: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Validate email in real-time
    if (name === "email") {
      if (value && !validateEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Final email validation before submission
    if (!validateEmail(formData.email)) {
      setEmailError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Optional: Basic password length check
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            leetcode_username: formData.leetcodeUsername,
          },
        },
      });

      if (error) throw error;

      // Success - auth store will handle redirect automatically
      console.log("Signup successful:", data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white-500/5 to-transparent pointer-events-none"></div>

        {/* Header */}
        <div className="text-center mb-10 relative">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img
              src={icon48}
              alt="D0 DSA"
              className="w-16 h-14 mr-2 bg-orange-500 p-2 rounded-lg"
            />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              D0 DSA
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {/* Full Name Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="input-base"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`input-base ${emailError ? "input-error" : ""}`}
              placeholder="Enter your email address"
            />
            {emailError && <p className="error-text">{emailError}</p>}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-base"
              placeholder="Create a strong password"
            />
          </div>

          {/* LeetCode Username Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300">
              LeetCode Username
            </label>
            <input
              type="text"
              name="leetcodeUsername"
              value={formData.leetcodeUsername}
              onChange={handleChange}
              className="input-base"
              placeholder="Your LeetCode username"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center p-4 rounded-xl backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="button-base">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size={16} />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center relative">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-orange-400 font-semibold cursor-pointer hover:text-orange-300 transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
