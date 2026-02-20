import 'dotenv/config';
import pool from '../../utils/db-standalone';

const provinces = [
  'BUENOS AIRES',
  'CATAMARCA',
  'CHACO',
  'CHUBUT',
  'CIUDAD DE BUENOS AIRES',
  'CÓRDOBA',
  'CORRIENTES',
  'ENTRE RÍOS',
  'FORMOSA',
  'JUJUY',
  'LA PAMPA',
  'LA RIOJA',
  'MENDOZA',
  'MISIONES',
  'NEUQUÉN',
  'RÍO NEGRO',
  'SALTA',
  'SAN JUAN',
  'SAN LUIS',
  'SANTA CRUZ',
  'SANTA FE',
  'SANTIAGO DEL ESTERO',
  'TIERRA DEL FUEGO',
  'TUCUMÁN',
];

export async function seed() {
  console.log('Seeding provinces...');
  
  for (const name of provinces) {
    await pool.execute(
      `INSERT INTO provinces (name) VALUES (?) ON DUPLICATE KEY UPDATE name = name`,
      [name]
    );
  }
  
  console.log(`✓ ${provinces.length} provinces seeded`);
}

if (import.meta.main) {
  seed().then(() => pool.end());
}
