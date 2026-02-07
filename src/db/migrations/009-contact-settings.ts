import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Inserting contact settings...');

  const contactSettings = [
    { key: 'contact_whatsapp', value: '+54 261 346-4334', description: 'Número de WhatsApp' },
    { key: 'contact_email', value: 'info@catbycam.com.ar', description: 'Correo electrónico de contacto' },
    { key: 'contact_address', value: 'Santa Fe 687, Mendoza, Argentina', description: 'Dirección física' },
    { key: 'contact_maps_url', value: 'https://maps.app.goo.gl/1Vx5FK9jrBDwsE4t8', description: 'URL de Google Maps' },
    { key: 'contact_maps_iframe', value: 'PGlmcmFtZSBzcmM9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vbWFwcy9lbWJlZD9wYj0hMW0xNCExbTghMW0zITFkNTM2MTQuOTQxMzU0ODU2MTQhMmQtNjguODI1MDczITNkLTMyLjg3MzQ3ITNtMiExaTEwMjQhMmk3NjghNGYxMy4xITNtMyExbTIhMXMweDk2N2UwOWM5YWQ5ZTgxOTklM0EweGMxM2NmNGNhYzM2NzE2YWIhMnNDYW1waWxsYXklMjBSZXB1ZXN0b3MhNWUwITNtMiExc2VzITJzYXIhNHYxNzcwNDg0ODcwMjgwITVtMiExc2VzITJzYXIiIHdpZHRoPSI2MDAiIGhlaWdodD0iNDUwIiBzdHlsZT0iYm9yZGVyOjA7IiBhbGxvd2Z1bGxzY3JlZW49IiIgbG9hZGluZz0ibGF6eSIgcmVmZXJyZXJwb2xpY3k9Im5vLXJlZmVycmVyLXdoZW4tZG93bmdyYWRlIj48L2lmcmFtZT4=', description: 'Iframe de Google Maps (base64)' },
  ];

  for (const setting of contactSettings) {
    await pool.execute(
      `INSERT INTO settings (\`key\`, value, description)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE value = value`,
      [setting.key, setting.value, setting.description]
    );
  }

  console.log('✓ Contact settings inserted');
}

export async function down() {
  await pool.execute(
    `DELETE FROM settings WHERE \`key\` IN ('contact_whatsapp', 'contact_email', 'contact_address', 'contact_maps_url', 'contact_maps_iframe')`
  );
  console.log('✓ Contact settings removed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  up().then(() => pool.end());
}
