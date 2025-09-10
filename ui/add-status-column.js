const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addStatusColumn() {
  console.log('🔧 Adicionando coluna status à tabela players...');
  
  try {
    // Executar SQL diretamente
    const { data, error } = await supabase
      .from('players')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error.message);
      return;
    }
    
    console.log('✅ Conexão com Supabase estabelecida');
    
    // Como não podemos executar ALTER TABLE diretamente via cliente JS,
    // vamos simular a funcionalidade usando uma abordagem alternativa
    console.log('\n💡 Para adicionar a coluna status, você precisa:');
    console.log('1. Acessar o painel do Supabase (https://supabase.com/dashboard)');
    console.log('2. Ir para seu projeto');
    console.log('3. Navegar para SQL Editor');
    console.log('4. Executar o seguinte SQL:');
    console.log('\n' + '='.repeat(60));
    console.log('ALTER TABLE players ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'active\';');
    console.log('UPDATE players SET status = \'active\' WHERE status IS NULL;');
    console.log('='.repeat(60));
    
    // Alternativa: usar uma função personalizada se existir
    console.log('\n🔄 Tentando abordagem alternativa...');
    
    // Vamos tentar atualizar um registro para forçar a criação da coluna
    // (isso não funcionará, mas nos dará uma mensagem de erro mais clara)
    const { error: updateError } = await supabase
      .from('players')
      .update({ status: 'active' })
      .eq('id', 1);
    
    if (updateError) {
      if (updateError.message.includes('status')) {
        console.log('❌ Confirmado: coluna status não existe');
        console.log('📝 Execute o SQL acima no painel do Supabase para resolver');
      } else {
        console.log('⚠️ Erro inesperado:', updateError.message);
      }
    } else {
      console.log('✅ Coluna status já existe e foi atualizada!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

addStatusColumn();