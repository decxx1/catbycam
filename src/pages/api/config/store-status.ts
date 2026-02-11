import type { APIRoute } from 'astro';
import { SettingsService } from '@/services/settingsService';

export const GET: APIRoute = async () => {
  try {
    const purchasesEnabled = await SettingsService.isPurchasesEnabled();
    return new Response(JSON.stringify({ purchases_enabled: purchasesEnabled }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching store status:', error);
    return new Response(JSON.stringify({ purchases_enabled: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
