"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";

import { saveNewUserToFirestore, getUserProfileFromFirestore, saveUserProfileToFirestore } from "@/lib/firestore";
import {
  auth,
  registerWithEmailPassword,
  loginWithEmailPassword,
  logoutFromFirebase,
} from "@/lib/firebase";


export type UserRole = "admin" | "customer";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginCustomer: (email: string, pass: string) => Promise<boolean>;
  registerCustomer: (name: string, email: string, pass: string, mobile?: string) => Promise<boolean>;
  updateUserProfile: (name: string, email: string, phone: string) => Promise<void>;
  loginAdmin: (email: string, pass: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem("luxegift_auth_user");
    return data ? (JSON.parse(data) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const stored = readStoredUser();
        const remoteProfile = await getUserProfileFromFirestore(fbUser.uid);
        const phone = remoteProfile?.phone || stored?.phone || "";
        const u: UserProfile = {
          id: fbUser.uid,
          name: remoteProfile?.name || fbUser.displayName || stored?.name || fbUser.email?.split("@")[0] || "Client Member",
          email: remoteProfile?.email || fbUser.email || "",
          phone,
          role: fbUser.email === "admin@luxegift.com" ? "admin" : "customer",
        };
        setUser(u);
        localStorage.setItem("luxegift_auth_user", JSON.stringify(u));
      } else {
        const stored = readStoredUser();
        setUser(stored);
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const saveUser = (u: UserProfile | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem("luxegift_auth_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("luxegift_auth_user");
    }
  };

  const loginCustomer = async (email: string, pass: string): Promise<boolean> => {
    const formattedEmail = email.toLowerCase().trim();
    if (!formattedEmail) return false;

    try {
      const res = await loginWithEmailPassword(formattedEmail, pass);
      const remoteProfile = await getUserProfileFromFirestore(res.user.uid);
      const storedUser = readStoredUser();
      const phone = remoteProfile?.phone || storedUser?.phone || "";

      const customerUser: UserProfile = {
        id: res.user.uid,
        name: remoteProfile?.name || res.user.name,
        email: res.user.email,
        phone,
        role: "customer",
      };
      saveUser(customerUser);
      // Update lastLoginAt in Firestore
      await saveNewUserToFirestore(customerUser, phone);
      return true;
    } catch (error: any) {
      console.error("Firebase customer login error:", error);
      if (
        error?.code === "auth/user-not-found" ||
        error?.code === "auth/invalid-credential" ||
        error?.code === "auth/wrong-password" ||
        error?.code === "auth/invalid-email"
      ) {
        toast.error("Invalid email or password. Please check your credentials.");
      } else if (error?.code === "auth/too-many-requests") {
        toast.error("Too many failed attempts. Please try again later.");
      } else if (error?.code === "auth/api-key-not-valid.-please-pass-a-valid-api-key.") {
        toast.error("Firebase configuration error. Please contact support.");
      } else {
        toast.error(error?.message || "Sign in failed. Please try again.");
      }
      return false;
    }
  };

  const registerCustomer = async (
    name: string,
    email: string,
    pass: string,
    mobile?: string
  ): Promise<boolean> => {
    const formattedEmail = email.toLowerCase().trim();
    if (!formattedEmail || !name.trim()) return false;

    try {
      const res = await registerWithEmailPassword(name, formattedEmail, pass);
      const cleanMobile = mobile?.trim() || "";
      const newCustomer: UserProfile = {
        id: res.user.uid,
        name: name.trim(),
        email: res.user.email,
        phone: cleanMobile,
        role: "customer",
      };
      saveUser(newCustomer);
      await saveNewUserToFirestore(newCustomer, cleanMobile);
      await saveUserProfileToFirestore(res.user.uid, {
        name: name.trim(),
        email: formattedEmail,
        phone: cleanMobile,
        tier: "Prestige Tier Member",
      });
      return true;
    } catch (error: any) {
      console.error("Firebase customer registration error:", error);
      if (error?.code === "auth/email-already-in-use") {
        toast.error("This email is already registered. Please sign in instead.");
      } else if (error?.code === "auth/weak-password") {
        toast.error("Password is too weak. Please use at least 6 characters.");
      } else if (error?.code === "auth/invalid-email") {
        toast.error("Invalid email address format.");
      } else if (error?.code === "auth/api-key-not-valid.-please-pass-a-valid-api-key.") {
        toast.error("Firebase configuration error. Please contact support.");
      } else {
        toast.error(error?.message || "Registration failed. Please try again.");
      }
      return false;
    }
  };

  const loginAdmin = (email: string, pass: string): boolean => {
    const formattedEmail = email.toLowerCase().trim();
    if (
      (formattedEmail === "admin@luxegift.com" && pass === "admin123") ||
      (formattedEmail === "admin" && pass === "admin")
    ) {
      const adminUser: UserProfile = {
        id: "admin-master",
        name: "Master Curator Admin",
        email: "admin@luxegift.com",
        role: "admin",
      };
      saveUser(adminUser);
      return true;
    }
    return false;
  };

  const updateUserProfile = async (name: string, email: string, phone: string) => {
    if (!user?.id) return;
    const cleanPhone = phone.trim();
    const updatedUser: UserProfile = {
      ...user,
      name: name.trim(),
      email: email.trim(),
      phone: cleanPhone,
    };
    saveUser(updatedUser);
    await saveUserProfileToFirestore(user.id, {
      name: name.trim(),
      email: email.trim(),
      phone: cleanPhone,
      tier: "Prestige Tier Member",
    });
    await saveNewUserToFirestore(updatedUser, cleanPhone);
  };

  const logout = () => {
    logoutFromFirebase();
    saveUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginCustomer,
        registerCustomer,
        updateUserProfile,
        loginAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
