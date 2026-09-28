import { useEffect, useState } from 'react';
import axiosClient from '@/api/axiosClient';
import { FETCH_PERFORMANCE_INFR_CLIENTS } from "@/api/apis";

export function useIFNRClients() {
  const [clients, setClients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get(FETCH_PERFORMANCE_INFR_CLIENTS)
      .then(res => {
        setClients(res.data.map((c: any) => c.client));
      })
      .finally(() => setLoading(false));
  }, []);

  return { clients, loading };
}
