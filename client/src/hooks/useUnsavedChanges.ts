import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

export function useUnsavedChanges() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [, setLocation] = useLocation();

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const navigateWithConfirmation = useCallback((path: string, onConfirm?: () => void) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "У вас есть несохранённые изменения. Вы уверены, что хотите покинуть эту страницу?"
      );
      if (confirmed) {
        setHasUnsavedChanges(false);
        setLocation(path);
        if (onConfirm) onConfirm();
      }
    } else {
      setLocation(path);
      if (onConfirm) onConfirm();
    }
  }, [hasUnsavedChanges, setLocation]);

  return {
    hasUnsavedChanges,
    markAsChanged,
    markAsSaved,
    navigateWithConfirmation
  };
}