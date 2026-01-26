import { MercadoPagoConfig, Preference } from 'mercadopago';

const accessToken = import.meta.env.MP_ACCESS_TOKEN || '';

if (!accessToken) {
  console.error('CRITICAL: MP_ACCESS_TOKEN is missing from environment variables!');
} else {
  console.log(`MP SDK initialized with token: ${accessToken.substring(0, 10)}...${accessToken.substring(accessToken.length - 5)}`);
}

const client = new MercadoPagoConfig({ 
  accessToken: accessToken,
  options: { timeout: 5000 }
});

export const mp = {
  preference: new Preference(client)
};
