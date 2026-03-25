import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useGlobalMarkup() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-settings-markup'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('global_markup_percent')
        .eq('id', 'global')
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    refetchOnWindowFocus: false,
  });

  const markupPercent = data?.global_markup_percent ?? 0;

  // Apply markup: if markup is +30, price becomes price * 1.3
  // If markup is -10, price becomes price * 0.9
  const applyMarkup = useCallback((basePrice: number): number => {
    return basePrice * (1 + markupPercent / 100);
  }, [markupPercent]);

  return { markupPercent, applyMarkup, isLoading };
}
