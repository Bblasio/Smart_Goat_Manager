import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type WeightUnit = 'kg' | 'lbs';
export type MilkUnit = 'L' | 'gal';
export type CurrencyUnit = 'Ksh' | 'USD' | 'EUR' | 'GBP';

interface UnitsContextType {
  currency: string;
  weightUnit: WeightUnit;
  milkUnit: MilkUnit;
  setCurrency: (c: string) => void;
  setWeightUnit: (w: WeightUnit) => void;
  setMilkUnit: (m: MilkUnit) => void;
  // Conversions and formatting
  convertWeight: (kg: number | null | undefined) => number;
  formatWeight: (kg: number | null | undefined, includeUnit?: boolean) => string;
  weightUnitLabel: string;
  convertMilk: (liters: number | null | undefined) => number;
  formatMilk: (liters: number | null | undefined, includeUnit?: boolean) => string;
  milkUnitLabel: string;
  formatCurrency: (amount: number | null | undefined) => string;
  currencySymbol: string;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

// Conversion constants
// 1 kg = 2.20462262185 lbs
const KG_TO_LBS = 2.20462;
// 1 Liter = 0.264172052 Gallons
const L_TO_GAL = 0.264172;

export const UnitsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      return localStorage.getItem('sgm_pref_currency') || 'Ksh';
    } catch {
      return 'Ksh';
    }
  });

  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(() => {
    try {
      const saved = localStorage.getItem('sgm_pref_weight_unit');
      return saved === 'lbs' ? 'lbs' : 'kg';
    } catch {
      return 'kg';
    }
  });

  const [milkUnit, setMilkUnitState] = useState<MilkUnit>(() => {
    try {
      const saved = localStorage.getItem('sgm_pref_milk_unit');
      return saved === 'gal' ? 'gal' : 'L';
    } catch {
      return 'L';
    }
  });

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem('sgm_pref_currency', newCurrency);
    } catch {
      // ignore
    }
  };

  const setWeightUnit = (newUnit: WeightUnit) => {
    setWeightUnitState(newUnit);
    try {
      localStorage.setItem('sgm_pref_weight_unit', newUnit);
    } catch {
      // ignore
    }
  };

  const setMilkUnit = (newUnit: MilkUnit) => {
    setMilkUnitState(newUnit);
    try {
      localStorage.setItem('sgm_pref_milk_unit', newUnit);
    } catch {
      // ignore
    }
  };

  // Convert kg to selected unit value
  const convertWeight = (kg: number | null | undefined): number => {
    if (kg == null || isNaN(Number(kg))) return 0;
    const num = Number(kg);
    if (weightUnit === 'lbs') {
      return Number((num * KG_TO_LBS).toFixed(1));
    }
    return Number(num.toFixed(1));
  };

  // Format weight with or without unit suffix
  const formatWeight = (kg: number | null | undefined, includeUnit = true): string => {
    if (kg == null || isNaN(Number(kg))) return '—';
    const converted = convertWeight(kg);
    return includeUnit ? `${converted} ${weightUnit}` : `${converted}`;
  };

  // Convert liters to selected unit value
  const convertMilk = (liters: number | null | undefined): number => {
    if (liters == null || isNaN(Number(liters))) return 0;
    const num = Number(liters);
    if (milkUnit === 'gal') {
      return Number((num * L_TO_GAL).toFixed(1));
    }
    return Number(num.toFixed(1));
  };

  // Format milk with or without unit suffix
  const formatMilk = (liters: number | null | undefined, includeUnit = true): string => {
    if (liters == null || isNaN(Number(liters))) return '0.0 ' + milkUnit;
    const converted = convertMilk(liters);
    return includeUnit ? `${converted} ${milkUnit}` : `${converted}`;
  };

  // Currency symbol helper
  const currencySymbol = (() => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        return 'Ksh';
    }
  })();

  // Format currency with proper notation and separator
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount == null || isNaN(Number(amount))) return `${currency} 0`;
    const num = Math.round(Number(amount));
    const formattedNum = num.toLocaleString('en-US');

    if (currency === 'USD') return `$${formattedNum}`;
    if (currency === 'EUR') return `€${formattedNum}`;
    if (currency === 'GBP') return `£${formattedNum}`;
    return `${currency} ${formattedNum}`;
  };

  return (
    <UnitsContext.Provider
      value={{
        currency,
        weightUnit,
        milkUnit,
        setCurrency,
        setWeightUnit,
        setMilkUnit,
        convertWeight,
        formatWeight,
        weightUnitLabel: weightUnit,
        convertMilk,
        formatMilk,
        milkUnitLabel: milkUnit,
        formatCurrency,
        currencySymbol,
      }}
    >
      {children}
    </UnitsContext.Provider>
  );
};

export const useUnits = (): UnitsContextType => {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
};
