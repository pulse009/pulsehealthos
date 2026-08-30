'use client';

import { useState, useEffect } from 'react';

export type DoctorTabKey =
  | 'schedule'
  | 'appointment-types'
  | 'blocked'
  | 'appointments'
  | 'overview'
  | 'coordinator'
  | 'payment-structure';

let currentGlobalTab: DoctorTabKey = 'schedule';
const tabListeners = new Set<(tab: DoctorTabKey) => void>();

export function setDoctorActiveTab(tab: DoctorTabKey) {
  currentGlobalTab = tab;
  tabListeners.forEach((fn) => fn(tab));
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  }
}

export function useDoctorActiveTab(initialUrlTab?: string | null): [DoctorTabKey, (tab: DoctorTabKey) => void] {
  const validTabs: DoctorTabKey[] = [
    'schedule',
    'appointment-types',
    'blocked',
    'appointments',
    'overview',
    'coordinator',
    'payment-structure',
  ];

  const [tab, setTab] = useState<DoctorTabKey>(() => {
    if (initialUrlTab && validTabs.includes(initialUrlTab as DoctorTabKey)) {
      currentGlobalTab = initialUrlTab as DoctorTabKey;
      return initialUrlTab as DoctorTabKey;
    }
    return currentGlobalTab;
  });

  useEffect(() => {
    if (initialUrlTab && validTabs.includes(initialUrlTab as DoctorTabKey) && initialUrlTab !== currentGlobalTab) {
      currentGlobalTab = initialUrlTab as DoctorTabKey;
      setTab(initialUrlTab as DoctorTabKey);
    }
  }, [initialUrlTab]);

  useEffect(() => {
    const listener = (newTab: DoctorTabKey) => {
      setTab(newTab);
    };
    tabListeners.add(listener);
    return () => {
      tabListeners.delete(listener);
    };
  }, []);

  return [tab, setDoctorActiveTab];
}
