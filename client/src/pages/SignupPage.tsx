import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { firebaseAuth } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

interface SignupFormValues {
  displayName: string;
  email: string;
  password: string;
}

export function SignupPage() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignupFormValues>();

  if (firebaseUser) return <Navigate to="/" replace />;

  const onSubmit = async (values: SignupFormValues) => {
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        values.email,
        values.password,
      );
      await updateProfile(credential.user, { displayName: values.displayName });
      navigate("/");
    } catch {
      setError("Could not create account. The email may already be in use.");
    }
  };

  return (
    <div>
      <h1>Sign up</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="displayName">Display name</label>
          <input id="displayName" type="text" required {...register("displayName")} />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required {...register("email")} />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
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
          {isSubmitting ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
