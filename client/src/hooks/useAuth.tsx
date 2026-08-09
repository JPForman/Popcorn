import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { firebaseAuth } from "../lib/firebase";
import { apiClient } from "../lib/apiClient";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ firebaseUser: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        try {
          await apiClient.post("/api/auth/bootstrap");
        } catch (err) {
          console.error("Failed to bootstrap user profile", err);
        }
      }
      setFirebaseUser(user);
      setLoading(false);
    });
  }, []);

  return <AuthContext.Provider value={{ firebaseUser, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
