/**
 * Script para corrigir a estrutura da tabela players
 * Adiciona as colunas necessárias que estão faltando
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Usar as mesmas configurações das funções do Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não encontradas');
  console.log('Configure as variáveis de ambiente ou use o arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTableStructure() {
  console.log('🔧 Corrigindo estrutura da tabela players...');
  
  try {
    // Verificar se as colunas já existem
    console.log('📋 Verificando estrutura atual da tabela...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default 
          FROM information_schema.columns 
          WHERE table_name = 'players' 
          ORDER BY ordinal_position;
        `
      });
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }
    
    console.log('📊 Colunas atuais:', columns);
    
    // Adicionar colunas que estão faltando
    const alterQueries = [
      'ALTER TABLE players ADD COLUMN IF NOT EXISTS faults INTEGER DEFAULT 0;',
      'ALTER TABLE players ADD COLUMN IF NOT EXISTS total_received INTEGER DEFAULT 0;',
      'ALTER TABLE players ADD COLUMN IF NOT EXISTS total_distributions INTEGER DEFAULT 0;'
    ];
    
    for (const query of alterQueries) {
      console.log('🔄 Executando:', query);
      const { error } = await supabase.rpc('exec', { sql: query });
      
      if (error) {
        console.error('❌ Erro ao executar query:', error);
      } else {
        console.log('✅ Query executada com sucesso');
      }
    }
    
    // Atualizar valores nulos
    console.log('🔄 Atualizando valores nulos...');
    const updateQueries = [
      'UPDATE players SET faults = 0 WHERE faults IS NULL;',
      'UPDATE players SET total_received = 0 WHERE total_received IS NULL;',
      'UPDATE players SET total_distributions = 0 WHERE total_distributions IS NULL;'
    ];
    
    for (const query of updateQueries) {
      const { error } = await supabase.rpc('exec', { sql: query });
      
      if (error) {
        console.error('❌ Erro ao atualizar valores:', error);
      } else {
        console.log('✅ Valores atualizados');
      }
    }
    
    // Verificar estrutura final
    console.log('📋 Verificando estrutura final...');
    const { data: finalColumns } = await supabase
      .rpc('exec', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default 
          FROM information_schema.columns 
          WHERE table_name = 'players' 
          ORDER BY ordinal_position;
        `
      });
    
    console.log('📊 Estrutura final:', finalColumns);
    console.log('✅ Correção da estrutura da tabela concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
fixTableStructure().then(() => {
  console.log('🎉 Script finalizado!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});