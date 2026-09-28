export interface TypeWiseCapacity {
  type: string; // 'NLD' | 'METRO' | 'OTHER'
  'Sum Of Customer Name': number;
  'Sum Of Created Capacity': number;
  'Sum Of Used Capacity': number;
  'AVG Of Utilization Percent': number;
  Technology: string; // 'CIENA' | 'NOKIA'
}

export interface CityWiseCapacity {
  Type: string; // 'NLD' | 'METRO' | 'OTHER'
  City: string;
  'Sum Of Customer Name': number;
  'Sum Of Created Capacity': number;
  'Sum Of Used Capacity': number;
  'AVG Of Utilization Percent': number;
  /** Short name for graph labels */
  'Short Name'?: string | null;
  'Technology Name': string; // 'CIENA' | 'NOKIA'
}

/**
 * Top customer data with technology
 */
export interface TopCustomerData {
  'Customer Name': string;
  'Total Count': number;
  Technology: string; // 'CIENA' | 'NOKIA'
}

/**
 * Filter state for dashboard
 */
export interface DashboardFilterState {
  /** Selected type: 'ALL' | 'NLD' | 'METRO' | 'OTHER' */
  type: 'ALL' | 'NLD' | 'METRO' | 'OTHER';
  /** Selected city from dropdown */
  city: string | null;
  /** Selected technology: 'ALL' | 'CIENA' | 'NOKIA' */
  technology: 'ALL' | 'CIENA' | 'NOKIA';
}

/**
 * Default filter values
 */
export const DEFAULT_DASHBOARD_FILTERS: DashboardFilterState = {
  type: 'ALL',
  city: null,
  technology: 'ALL',
};

/** Technology color map */
export { TECHNOLOGY_COLORS_HSL as TECHNOLOGY_COLORS } from '../../utils/technologyColors';
