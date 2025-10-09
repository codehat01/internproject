
import { CSSProperties } from 'react';

export interface Colors {
  navyBlue: string;
  white: string;
  golden: string;
  lightGray: string;
  green: string;
  red: string;
  darkGray: string;
}

export interface ButtonStyle extends CSSProperties {
  backgroundColor: string;
  color: string;
  border: string;
  borderRadius: string;
  padding: string;
  fontWeight: string;
  cursor: string;
  transition: string;
}

export interface ButtonStyles {
  primary: ButtonStyle;
  success: ButtonStyle;
  danger: ButtonStyle;
  golden: ButtonStyle;
}

export interface CardStyle extends CSSProperties {
  backgroundColor: string;
  borderRadius: string;
  boxShadow: string;
  padding: string;
}

export interface Theme {
  colors: Colors;
  card: CardStyle;
  button: ButtonStyles;
}

export const colors: Colors = {
  navyBlue: '#0a1f44',
  white: '#ffffff',
  golden: '#d4af37',
  lightGray: '#f2f2f2',
  green: '#28a745',
  red: '#dc3545',
  darkGray: '#6c757d'
} as const;

export const theme: Theme = {
  colors,
  // Common styles
  card: {
    backgroundColor: colors.white,
    borderRadius: '15px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
    padding: '25px'
  },
  button: {
    primary: {
      backgroundColor: colors.navyBlue,
      color: colors.white,
      border: 'none',
      borderRadius: '10px',
      padding: '12px 24px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    success: {
      backgroundColor: colors.green,
      color: colors.white,
      border: 'none',
      borderRadius: '10px',
      padding: '12px 24px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    danger: {
      backgroundColor: colors.red,
      color: colors.white,
      border: 'none',
      borderRadius: '10px',
      padding: '12px 24px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    golden: {
      backgroundColor: colors.golden,
      color: colors.white,
      border: 'none',
      borderRadius: '10px',
      padding: '12px 24px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    }
  }
} as const;