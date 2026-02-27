import { Goal } from './types';

export const INITIAL_DATA: Goal[] = [
  {
    id: 'running',
    name: 'Running (1 Mile)',
    current: 3,
    target: 51,
    unit: 'Miles',
    category: 'physical',
  },
  {
    id: 'gym',
    name: 'Gym Sessions',
    current: 2,
    target: 51,
    unit: 'Sessions',
    category: 'physical',
  },
  {
    id: 'jump-ropes',
    name: 'Jump Ropes',
    current: 2028,
    target: 51000,
    unit: 'Ropes',
    category: 'physical',
  },
  {
    id: 'sit-ups',
    name: 'Sit-ups',
    current: 65,
    target: 5000,
    unit: 'Reps',
    category: 'physical',
  },
  {
    id: 'manache-shlok',
    name: 'Manache Shlok',
    current: 22,
    target: 51,
    unit: 'Shloks',
    category: 'mental',
  },
  {
    id: 'shir-sasan',
    name: 'Shir-sasan',
    current: 1.5,
    target: 100,
    unit: 'Minutes',
    category: 'physical',
  },
  {
    id: 'surya-namaskar',
    name: 'Surya Namaskar',
    current: 12,
    target: 500,
    unit: 'Reps',
    category: 'physical',
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    current: 11,
    target: 500,
    unit: 'Reps',
    category: 'physical',
  },
];

export const START_DATE = '2026-02-23T00:00:00';
export const TARGET_DATE = '2026-06-25';
