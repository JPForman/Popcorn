import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { firebaseAuth } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>();

  if (firebaseUser) return <Navigate to="/" replace />;

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(firebaseAuth, values.email, values.password);
      navigate("/");
    } catch {
      setError("Invalid email or password.");
    }
  };

  return (
    <div>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required {...register("email")} />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            {...register("password")}
          />
        </div>
        {error && (
          <p role="alert" style={{ color: "crimson" }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p>
        No account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}
