"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";

// Define TypeScript types for our form data manually
interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  role: "Farmer" | "Buyer" | "Admin" | "";
}

interface LoginFormValues {
  email: string;
  password: string;
}

// A single component to manage and render the auth forms
const AuthForm = () => {
  const [mode, setMode] = useState<"login" | "register">("register");

  const AuthForm = ({
    mode,
    setMode,
  }: {
    mode: "login" | "register";
    setMode: (mode: "login" | "register") => void;
  }) => {
    const isRegisterMode = mode === "register";

    // Use a generic type that covers both login and register
    type FormValues = Partial<RegisterFormValues & LoginFormValues>;

    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = useForm<FormValues>();

    const [apiError, setApiError] = useState<string | null>(null);
    const [apiSuccess, setApiSuccess] = useState<string | null>(null);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
      setApiError(null);
      setApiSuccess(null);
      const endpoint = isRegisterMode
        ? "/api/auth/register"
        : "/api/auth/login";

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Submitting to", endpoint, data);

      // Mock API response
      if (data.email === "fail@example.com") {
        setApiError("This email is already taken. Please try another.");
      } else {
        setApiSuccess(
          isRegisterMode
            ? "Registration successful! Please log in."
            : "Login successful! Redirecting..."
        );
        // In a real app, you would redirect here upon successful login
      }
    };

    return (
      <div className="w-full max-w-md p-8 space-y-6 bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isRegisterMode ? "Create an Account" : "Welcome Back"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isRegisterMode
              ? "Already have an account? "
              : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setMode(isRegisterMode ? "login" : "register")}
              className="font-medium text-green-600 hover:text-green-500 bg-transparent border-none cursor-pointer"
            >
              {isRegisterMode ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <input
                id="name"
                type="text"
                {...register("name", { required: "Name is required" })}
                placeholder="Full Name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address",
                },
              })}
              placeholder="Email Address"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              placeholder="Password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {isRegisterMode && (
            <div>
              <label htmlFor="role" className="sr-only">
                Role
              </label>
              <select
                id="role"
                {...register("role", { required: "Please select a role" })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                defaultValue=""
              >
                <option value="" disabled>
                  Select your role
                </option>
                <option value="Farmer">Farmer</option>
                <option value="Buyer">Buyer</option>
                <option value="Admin">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.role.message}
                </p>
              )}
            </div>
          )}

          {apiError && (
            <p className="text-sm text-center text-red-600">{apiError}</p>
          )}
          {apiSuccess && (
            <p className="text-sm text-center text-green-600">{apiSuccess}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 transition-all"
          >
            {isSubmitting
              ? "Processing..."
              : isRegisterMode
              ? "Create Account"
              : "Log In"}
          </button>
        </form>
      </div>
    );
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1932&auto=format&fit=crop')",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="relative z-10">
        <AuthForm mode={mode} setMode={setMode} />
      </div>
    </main>
  );
};

export default AuthForm;
