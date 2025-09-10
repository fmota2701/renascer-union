const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configurações do Supabase (substitua pelos seus valores)
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Tentar ler as configurações do arquivo .env se existir
try {
  require('dotenv').config();
  const supabaseUrl = process.env.SUPABASE_URL || SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
  
  console.log('🔧 Configurando cliente Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Ler o arquivo SQL
  console.log('📖 Lendo arquivo SQL...');
  const sql = fs.readFileSync('./create-released-items-tables.sql', 'utf8');
  
  console.log('🚀 Executando SQL no Supabase...');
  console.log('\n=== COPIE E COLE ESTE SQL NO SUPABASE SQL EDITOR ===\n');
  console.log(sql);
  console.log('\n=== FIM DO SQL ===\n');
  
  console.log('⚠️  IMPORTANTE: Execute o SQL acima manualmente no Supabase SQL Editor');
  console.log('📍 Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  
  // Mostrar o SQL para execução manual
  try {
    const sql = fs.readFileSync('./create-released-items-tables.sql', 'utf8');
    console.log('\n=== COPIE E COLE ESTE SQL NO SUPABASE SQL EDITOR ===\n');
    console.log(sql);
    console.log('\n=== FIM DO SQL ===\n');
    console.log('⚠️  Execute o SQL acima manualmente no Supabase SQL Editor');
  } catch (readError) {
    console.error('❌ Erro ao ler arquivo SQL:', readError.message);
  }
}