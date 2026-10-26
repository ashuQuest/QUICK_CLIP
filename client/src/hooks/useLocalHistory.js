import { useState, useEffect } from 'react';

const STORAGE_KEY = 'quickclip_recent_shares';

export function useLocalHistory() {
  const [shares, setShares] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shares));
    } catch (e) {
      console.warn('Failed to save share history to localStorage', e);
    }
  }, [shares]);

  const addShare = (shareItem) => {
    setShares((prev) => {
      // Remove duplicate if already present
      const filtered = prev.filter((item) => item.shareId !== shareItem.shareId);
      // Prepend newest share, keep last 30
      return [
        {
          ...shareItem,
          createdAt: shareItem.createdAt || new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 30);
    });
  };

  const removeShare = (shareId) => {
    setShares((prev) => prev.filter((item) => item.shareId !== shareId));
  };

  const clearHistory = () => {
    setShares([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getManagementToken = (shareId) => {
    const item = shares.find((s) => s.shareId === shareId || s.code === shareId);
    return item?.managementToken || null;
  };

  return {
    shares,
    addShare,
    removeShare,
    clearHistory,
    getManagementToken,
  };
}
