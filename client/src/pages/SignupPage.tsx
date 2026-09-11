import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { firebaseAuth } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { AuthLayout } from "../components/layout/AuthLayout";
import { AuthField } from "../components/forms/AuthField";
import { AuthSubmitButton } from "../components/forms/AuthSubmitButton";
import formStyles from "../components/forms/AuthField.module.scss";

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
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={formStyles.form}>
        <AuthField id="displayName" label="Display name" registration={register("displayName")} />
        <AuthField id="email" label="Email" type="email" autoComplete="email" registration={register("email")} />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          registration={register("password")}
        />
        {error && (
          <p role="alert" className="formError">
            {error}
          </p>
        )}
        <AuthSubmitButton disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Sign up"}
        </AuthSubmitButton>
      </form>
    </AuthLayout>
  );
}
