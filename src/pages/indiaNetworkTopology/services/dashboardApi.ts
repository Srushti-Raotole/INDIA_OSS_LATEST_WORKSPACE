


import { GET_FIBER_LAST_CAPTURE_TIME, GET_IP_LAST_CAPTURE_TIME, GET_SECTOR_WISE_CAPACITY_SUMMARY, GET_TOP_10_CUSTOMERS, GET_TOTAL_CAPACITY_SUMMARY } from "@/api/apis";
import axiosClient from "@/api/axiosClient";
import type { CityWiseCapacity, TypeWiseCapacity, TopCustomerData } from '../components/dashboard/types';


export async function fetchSectorWiseCapacity(): Promise<CityWiseCapacity[]> {
  const response = await axiosClient.get<CityWiseCapacity[]>(GET_SECTOR_WISE_CAPACITY_SUMMARY);
  return response.data;
}

/**
 * Fetch total capacity summary (type-wise per technology).
 * API returns lowercase 'type' key — map to TypeWiseCapacity format.
 */
export async function fetchTotalCapacitySummary(): Promise<TypeWiseCapacity[]> {
  const response = await axiosClient.get<any[]>(GET_TOTAL_CAPACITY_SUMMARY);
  return response.data.map((item) => ({
    type: item.type || item.Type,
    'Sum Of Customer Name': item['Sum Of Customer Name'],
    'Sum Of Created Capacity': item['Sum Of Created Capacity'],
    'Sum Of Used Capacity': item['Sum Of Used Capacity'],
    'AVG Of Utilization Percent': item['AVG Of Utilization Percent'],
    Technology: item.Technology,
  }));
}

/**
 * Fetch top 10 customers.
 */
export async function fetchTopCustomers(): Promise<TopCustomerData[]> {
  const response = await axiosClient.get<TopCustomerData[]>(GET_TOP_10_CUSTOMERS);
  return response.data;
}

/**
 * Fetch last capture time for IP/OPTICAL data.
 */
export async function fetchIPLastCaptureTime(): Promise<string> {
  const response = await axiosClient.get<any>(GET_IP_LAST_CAPTURE_TIME);
  return response.data?.lastCaptureTime ?? response.data ?? '';
}

/**
 * Fetch last capture time for Fiber data.
 */
export async function fetchFiberLastCaptureTime(): Promise<string> {
  const response = await axiosClient.get<any>(GET_FIBER_LAST_CAPTURE_TIME);
  return response.data?.lastCaptureTime ?? response.data ?? '';
}
