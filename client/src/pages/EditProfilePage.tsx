import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail } from "firebase/auth";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import type { AvatarOption } from "@popcorn/shared";
import { firebaseAuth } from "../lib/firebase";
import { apiClient } from "../lib/apiClient";
import { useCurrentUser } from "../hooks/api/useCurrentUser";
import { useUpdateProfile } from "../hooks/api/useUpdateProfile";
import { AvatarPicker } from "../components/profile/AvatarPicker";
import { AuthField } from "../components/forms/AuthField";
import { AuthSubmitButton } from "../components/forms/AuthSubmitButton";
import formStyles from "../components/forms/AuthField.module.scss";
import styles from "./EditProfilePage.module.scss";

interface ProfileFormValues {
  displayName: string;
  avatarUrl: AvatarOption | null;
}

interface EmailFormValues {
  email: string;
}

interface ReauthFormValues {
  password: string;
}

function firebaseErrorCode(err: unknown): string | undefined {
  return err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : undefined;
}

function firebaseErrorMessage(err: unknown, fallback: string): string {
  switch (firebaseErrorCode(err)) {
    case "auth/email-already-in-use":
      return "That email is already in use by another account.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect password.";
    default:
      return fallback;
  }
}

export function EditProfilePage() {
  const { data: currentUser } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();

  const profileForm = useForm<ProfileFormValues>({
    values: currentUser
      ? { displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl as AvatarOption | null }
      : undefined,
  });
  const avatarUrl = useWatch({ control: profileForm.control, name: "avatarUrl" });
  const emailForm = useForm<EmailFormValues>({
    values: currentUser ? { email: currentUser.email } : undefined,
  });
  const reauthForm = useForm<ReauthFormValues>();

  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [reauthError, setReauthError] = useState<string | null>(null);

  if (!currentUser) return <p>Loading…</p>;
  const currentEmail = currentUser.email;

  function onSubmitProfile(values: ProfileFormValues) {
    updateProfile.mutate(values);
  }

  async function syncEmailChange() {
    await apiClient.post("/api/auth/bootstrap");
    await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    setEmailSuccess(true);
    setPendingEmail(null);
    reauthForm.reset();
  }

  async function onSubmitEmail(values: EmailFormValues) {
    setEmailError(null);
    setEmailSuccess(false);
    const user = firebaseAuth.currentUser;
    if (!user) return;

    try {
      await updateEmail(user, values.email);
      await syncEmailChange();
    } catch (err) {
      if (firebaseErrorCode(err) === "auth/requires-recent-login") {
        setPendingEmail(values.email);
        return;
      }
      setEmailError(firebaseErrorMessage(err, "Couldn't update your email. Try again."));
    }
  }

  async function onSubmitReauth(values: ReauthFormValues) {
    setReauthError(null);
    const user = firebaseAuth.currentUser;
    if (!user || !pendingEmail) return;

    try {
      const credential = EmailAuthProvider.credential(user.email ?? currentEmail, values.password);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, pendingEmail);
      await syncEmailChange();
    } catch (err) {
      setReauthError(firebaseErrorMessage(err, "Couldn't confirm your password. Try again."));
    }
  }

  return (
    <div className={styles.page}>
      <h1>Edit profile</h1>

      <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className={`${formStyles.form} ${styles.card}`}>
        <h2>Profile</h2>
        <AuthField
          id="displayName"
          label="Display name"
          registration={profileForm.register("displayName", { required: true })}
        />
        <AvatarPicker
          value={avatarUrl}
          onChange={(option) => profileForm.setValue("avatarUrl", option, { shouldDirty: true })}
        />
        {updateProfile.isError && <p role="alert">Couldn't update your profile. Try again.</p>}
        {updateProfile.isSuccess && <p>Profile updated.</p>}
        <AuthSubmitButton disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving…" : "Save profile"}
        </AuthSubmitButton>
      </form>

      <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className={`${formStyles.form} ${styles.card}`}>
        <h2>Email</h2>
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          registration={emailForm.register("email", { required: true })}
        />
        {emailError && <p role="alert">{emailError}</p>}
        {emailSuccess && <p>Email updated.</p>}
        <AuthSubmitButton disabled={emailForm.formState.isSubmitting}>
          {emailForm.formState.isSubmitting ? "Saving…" : "Save email"}
        </AuthSubmitButton>

        {pendingEmail && (
          <div className={styles.reauth}>
            <p>Re-enter your password to confirm this change.</p>
            <AuthField
              id="reauthPassword"
              label="Current password"
              type="password"
              autoComplete="current-password"
              registration={reauthForm.register("password", { required: true })}
            />
            {reauthError && <p role="alert">{reauthError}</p>}
            <button
              type="button"
              onClick={reauthForm.handleSubmit(onSubmitReauth)}
              disabled={reauthForm.formState.isSubmitting}
            >
              {reauthForm.formState.isSubmitting ? "Confirming…" : "Confirm password"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
