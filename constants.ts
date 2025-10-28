
import { Sector } from './types';

export const SECTORS_OPTIONS = Object.values(Sector).map(value => ({
    value: value,
    label: value,
}));

export const DEFAULT_COLUMNS = [
  { 
    title: 'Non Categorizzato', 
    icon: 'fas fa-question-circle', 
    color: 'bg-gray-100 text-gray-800', 
    darkColor: 'dark:bg-gray-700 dark:text-gray-200',
    textColor: 'text-gray-500',
  },
  { 
    title: 'Da Contattare', 
    icon: 'fas fa-phone-alt', 
    color: 'bg-blue-100 text-blue-800', 
    darkColor: 'dark:bg-blue-900 dark:text-blue-200',
    textColor: 'text-blue-500',
  },
  { 
    title: 'In Trattativa', 
    icon: 'fas fa-comments-dollar', 
    color: 'bg-yellow-100 text-yellow-800',
    darkColor: 'dark:bg-yellow-900 dark:text-yellow-200',
    textColor: 'text-yellow-500',
  },
  { 
    title: 'Acquisito', 
    icon: 'fas fa-check-circle', 
    color: 'bg-green-100 text-green-800', 
    darkColor: 'dark:bg-green-900 dark:text-green-200',
    textColor: 'text-green-500',
  },
  { 
    title: 'Perso', 
    icon: 'fas fa-times-circle', 
    color: 'bg-red-100 text-red-800',
    darkColor: 'dark:bg-red-900 dark:text-red-200',
    textColor: 'text-red-500',
  },
];
