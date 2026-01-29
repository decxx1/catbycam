import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function seed() {
  console.log('Seeding categories...');
  
  const categories = ['Maquinaria', 'Repuestos', 'Filtros', 'Lubricantes', 'Orugas'];
  
  for (const cat of categories) {
    const slug = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    
    // Check if exists
    const [existing]: any = await pool.execute('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing.length === 0) {
      await pool.execute('INSERT INTO categories (name, slug) VALUES (?, ?)', [cat, slug]);
      console.log(`  ✓ Created category: ${cat}`);
    } else {
      console.log(`  - Category already exists: ${cat}`);
    }
  }
  
  console.log('✓ Categories seeded');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed().then(() => pool.end());
}
