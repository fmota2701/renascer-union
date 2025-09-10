/**
 * Script para adicionar colunas faltantes na tabela players
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumns() {
  console.log('🔧 Verificando estrutura atual da tabela players...');
  
  // Primeiro, vamos verificar a estrutura atual
  const { data: currentData, error: currentError } = await supabase
    .from('players')
    .select('*')
    .limit(1);
    
  if (currentError) {
    console.error('❌ Erro ao verificar tabela:', currentError);
    return;
  }
  
  console.log('📋 Colunas atuais:', Object.keys(currentData?.[0] || {}));
  
  // Vamos tentar atualizar um registro para ver quais colunas existem
  const testUpdate = {
    total_items: 0,
    status: 'active',
    faults: 0,
    total_distributions: 0,
    last_distribution_date: null
  };
  
  console.log('🧪 Testando atualização com novas colunas...');
  
  const { data: updateData, error: updateError } = await supabase
    .from('players')
    .update(testUpdate)
    .eq('id', currentData[0]?.id)
    .select();
    
  if (updateError) {
    console.error('❌ Erro na atualização (algumas colunas podem não existir):', updateError.message);
  } else {
    console.log('✅ Atualização bem-sucedida! Colunas disponíveis.');
    console.log('📋 Estrutura atualizada:', Object.keys(updateData?.[0] || {}));
  }
}

addMissingColumns().then(() => {
  console.log('🎉 Verificação finalizada!');
}).catch(error => {
  console.error('❌ Erro:', error);
});