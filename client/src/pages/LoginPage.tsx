import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { firebaseAuth } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { AuthLayout } from "../components/layout/AuthLayout";
import { AuthField } from "../components/forms/AuthField";
import { AuthSubmitButton } from "../components/forms/AuthSubmitButton";
import formStyles from "../components/forms/AuthField.module.scss";

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
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={formStyles.form}>
        <AuthField id="email" label="Email" type="email" autoComplete="email" registration={register("email")} />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          registration={register("password")}
        />
        {error && (
          <p role="alert" className="formError">
            {error}
          </p>
        )}
        <AuthSubmitButton disabled={isSubmitting}>{isSubmitting ? "Logging in…" : "Log in"}</AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}
