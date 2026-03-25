import { MC_CUSTOMER_ID, MC_TEST_CUSTOMER_ID, MC_USER, MC_PASSWORD, CA_EMAIL, CA_PASSWORD } from 'astro:env/server';

const activeCustomerId: string = import.meta.env.PROD ? MC_CUSTOMER_ID : (MC_TEST_CUSTOMER_ID ?? MC_CUSTOMER_ID);
import { fetchMiCorreo } from '@/utils/micorreo';

// ---- Types ----------------------------------------------------------------

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  documentType: 'DNI' | 'CUIT';
  documentId: string;
  phone?: string;
  cellPhone?: string;
  address?: {
    streetName: string;
    streetNumber: string;
    floor?: string;
    apartment?: string;
    locality?: string;
    city: string;
    provinceCode: string;
    postalCode: string;
  };
}

export interface Dimensions {
  weight: number; // grams, 1–25000
  height: number; // cm, max 150
  width: number;  // cm, max 150
  length: number; // cm, max 150
}

export interface Rate {
  deliveredType: 'D' | 'S';
  productType: string;
  productName: string;
  price: number;
  deliveryTimeMin: string;
  deliveryTimeMax: string;
}

export interface RatesResponse {
  customerId: string;
  validTo: string;
  rates: Rate[];
}

export interface ShippingAddress {
  streetName: string;
  streetNumber: string;
  floor?: string;
  apartment?: string;
  city: string;
  provinceCode: string; // Single letter, e.g. "B", "X"
  postalCode: string;
}

export interface ImportShippingData {
  extOrderId: string;        // Internal order ID (used to deduplicate)
  orderNumber?: string;      // Human-readable order number shown in MiCorreo
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  deliveryType: 'D' | 'S';  // D = home delivery, S = branch pickup
  agency?: string;           // Required when deliveryType = 'S'
  shippingAddress?: ShippingAddress; // Required when deliveryType = 'D'
  dimensions: Dimensions;
  declaredValue: number;
}

export interface ImportResponse {
  createdAt: string;
}

export interface TrackingEvent {
  event: string;
  date: string;
  branch: string;
  status: string;
  sign: string;
}

export interface TrackingResult {
  id: string | null;
  productId: string | null;
  trackingNumber: string;
  events: TrackingEvent[];
}

// ---- Service ----------------------------------------------------------------

export const MiCorreoService = {
  /**
   * Quotes shipping rates for a given destination and package dimensions.
   * @param postalCodeDestination - Destination postal code
   * @param dimensions - Package weight (grams) and dimensions (cm)
   * @param deliveredType - 'D' for home delivery, 'S' for branch pickup, undefined for both
   */
  async getRates(
    postalCodeDestination: string,
    dimensions: Dimensions,
    deliveredType?: 'D' | 'S'
  ): Promise<RatesResponse> {
    const body: Record<string, unknown> = {
      customerId: activeCustomerId,
      postalCodeOrigin: '5000', // Origen de la tienda (Córdoba). Configurable via settings si se necesita.
      postalCodeDestination,
      dimensions: {
        weight: Math.round(dimensions.weight),
        height: Math.round(dimensions.height),
        width: Math.round(dimensions.width),
        length: Math.round(dimensions.length),
      },
    };

    if (deliveredType) {
      body.deliveredType = deliveredType;
    }

    return fetchMiCorreo<RatesResponse>('/rates', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Imports a shipment to MiCorreo after an order is confirmed.
   */
  async importShipping(data: ImportShippingData): Promise<ImportResponse> {
    const body: Record<string, unknown> = {
      customerId: activeCustomerId,
      extOrderId: data.extOrderId,
      orderNumber: data.orderNumber ?? data.extOrderId,
      sender: {
        name: null,
        phone: null,
        cellPhone: null,
        email: null,
        originAddress: {
          streetName: null,
          streetNumber: null,
          floor: null,
          apartment: null,
          city: null,
          provinceCode: null,
          postalCode: null,
        },
      },
      recipient: {
        name: data.recipientName,
        phone: data.recipientPhone ?? '',
        cellPhone: data.recipientPhone ?? '',
        email: data.recipientEmail,
      },
      shipping: {
        deliveryType: data.deliveryType,
        agency: data.agency ?? null,
        address:
          data.deliveryType === 'D' && data.shippingAddress
            ? {
                streetName: data.shippingAddress.streetName,
                streetNumber: data.shippingAddress.streetNumber,
                floor: data.shippingAddress.floor ?? '',
                apartment: data.shippingAddress.apartment ?? '',
                city: data.shippingAddress.city,
                provinceCode: data.shippingAddress.provinceCode,
                postalCode: data.shippingAddress.postalCode,
              }
            : null,
        productType: 'CP',
        weight: Math.round(data.dimensions.weight),
        declaredValue: data.declaredValue,
        height: Math.round(data.dimensions.height),
        length: Math.round(data.dimensions.length),
        width: Math.round(data.dimensions.width),
      },
    };

    return fetchMiCorreo<ImportResponse>('/shipping/import', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Gets tracking events for an imported shipment.
   * @param shippingId - The extOrderId used when calling importShipping (= order ID as string)
   */
  async getTracking(shippingId: string): Promise<TrackingResult[]> {
    return fetchMiCorreo<TrackingResult[]>(`/shipping/tracking?shippingId=${encodeURIComponent(shippingId)}`, {
      method: 'GET',
    });
  },

  /**
   * Validates the store's MiCorreo account and returns its customerId.
   * Useful for verifying credentials and confirming the MC_CUSTOMER_ID value.
   */
  async validateUser(): Promise<{ customerId: string; createdAt: string }> {
    return fetchMiCorreo<{ customerId: string; createdAt: string }>('/users/validate', {
      method: 'POST',
      body: JSON.stringify({
        email: CA_EMAIL ?? MC_USER,
        password: CA_PASSWORD ?? MC_PASSWORD,
      }),
    });
  },

  /**
   * Registers a new user in MiCorreo. Useful for creating a test account in the test environment.
   */
  async registerUser(data: RegisterUserData): Promise<{ customerId: string; createdAt: string }> {
    return fetchMiCorreo<{ customerId: string; createdAt: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
