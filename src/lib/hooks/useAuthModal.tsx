"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AuthModalState {
  isOpen: boolean;
  initialView: "login" | "signup";
  returnTo?: string;
}

interface AuthModalContextType {
  isOpen: boolean;
  initialView: "login" | "signup";
  returnTo?: string;
  openModal: (view?: "login" | "signup", returnTo?: string) => void;
  closeModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType>({
  isOpen: false,
  initialView: "signup",
  openModal: () => {},
  closeModal: () => {},
});

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthModalState>({
    isOpen: false,
    initialView: "signup",
  });

  const openModal = useCallback((view: "login" | "signup" = "signup", returnTo?: string) => {
    setState({
      isOpen: true,
      initialView: view,
      returnTo,
    });
  }, []);

  const closeModal = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        ...state,
        openModal,
        closeModal,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export const useAuthModal = () => useContext(AuthModalContext);

// Hook to require authentication for an action
export function useRequireAuth(returnTo?: string) {
  const { openModal } = useAuthModal();
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((action: () => void) => {
    setPendingAction(() => action);
    setIsAuthRequired(true);
    openModal("signup", returnTo);
  }, [openModal, returnTo]);

  const executePendingAction = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
      setIsAuthRequired(false);
    }
  }, [pendingAction]);

  return {
    requireAuth,
    isAuthRequired,
    executePendingAction,
  };
}

