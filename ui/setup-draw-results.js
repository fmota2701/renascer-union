const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function setupDrawResults() {
  try {
    console.log('Criando tabela draw_results...');
    
    // Primeiro, vamos tentar criar a tabela usando uma query simples
    const { data, error } = await supabase
      .from('draw_results')
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('Tabela não existe, criando...');
      
      // Usar SQL direto através do REST API
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY}`,
          'apikey': process.env.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          sql: `
            CREATE TABLE IF NOT EXISTS draw_results (
              id SERIAL PRIMARY KEY,
              player_name TEXT NOT NULL,
              item_name TEXT NOT NULL,
              draw_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'skipped')),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            ALTER TABLE draw_results ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Allow all access" ON draw_results;
            CREATE POLICY "Allow all access" ON draw_results FOR ALL USING (true);
          `
        })
      });
      
      if (response.ok) {
        console.log('✅ Tabela draw_results criada com sucesso!');
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao criar tabela:', errorText);
      }
    } else {
      console.log('✅ Tabela draw_results já existe!');
    }
    
    // Testar inserção
    console.log('Testando inserção...');
    const { data: testData, error: testError } = await supabase
      .from('draw_results')
      .insert({
        player_name: 'Teste',
        item_name: 'Item Teste',
        status: 'active'
      })
      .select();
    
    if (testError) {
      console.error('❌ Erro no teste:', testError);
    } else {
      console.log('✅ Teste de inserção bem-sucedido:', testData);
      
      // Limpar teste
      await supabase
        .from('draw_results')
        .delete()
        .eq('player_name', 'Teste');
      
      console.log('✅ Dados de teste removidos');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

setupDrawResults();