#!/usr/bin/env node

/**
 * Teste direto da API Supabase
 * Execute: node test-supabase-direct.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class SupabaseDirectTest {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('❌ Credenciais do Supabase não encontradas');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async testConnection() {
    console.log('🔍 Testando conexão com Supabase...');
    console.log(`📍 URL: ${this.supabaseUrl}`);
    
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log('❌ Erro na conexão:', error.message);
        return false;
      }
      
      console.log('✅ Conexão estabelecida com sucesso!');
      return true;
    } catch (error) {
      console.log('❌ Erro na conexão:', error.message);
      return false;
    }
  }

  async testTables() {
    console.log('\n📋 Testando tabelas...');
    
    const tables = [
      { name: 'players', description: 'Jogadores' },
      { name: 'items', description: 'Itens' },
      { name: 'history', description: 'Histórico' },
      { name: 'system_config', description: 'Configurações' }
    ];
    
    let allTablesOk = true;
    
    for (const table of tables) {
      try {
        const { data, error, count } = await this.supabase
          .from(table.name)
          .select('*', { count: 'exact' });
        
        if (error) {
          console.log(`❌ Erro na tabela ${table.description}: ${error.message}`);
          allTablesOk = false;
        } else {
          console.log(`✅ Tabela ${table.description}: ${count || 0} registros`);
        }
      } catch (error) {
        console.log(`❌ Erro na tabela ${table.description}: ${error.message}`);
        allTablesOk = false;
      }
    }
    
    return allTablesOk;
  }

  async testCRUD() {
    console.log('\n🧪 Testando operações CRUD...');
    
    try {
      // 1. Criar um jogador de teste
      console.log('   📝 Criando jogador de teste...');
      const { data: newPlayer, error: createError } = await this.supabase
        .from('players')
        .insert({
          name: 'Teste_' + Date.now(),
          total_items: 0
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Erro ao criar jogador:', createError.message);
        return false;
      }
      
      console.log(`   ✅ Jogador criado: ${newPlayer.name} (ID: ${newPlayer.id})`);
      
      // 2. Ler o jogador
      console.log('   📖 Lendo jogador...');
      const { data: readPlayer, error: readError } = await this.supabase
        .from('players')
        .select('*')
        .eq('id', newPlayer.id)
        .single();
      
      if (readError) {
        console.log('❌ Erro ao ler jogador:', readError.message);
        return false;
      }
      
      console.log(`   ✅ Jogador lido: ${readPlayer.name}`);
      
      // 3. Atualizar o jogador
      console.log('   ✏️  Atualizando jogador...');
      const { data: updatedPlayer, error: updateError } = await this.supabase
        .from('players')
        .update({ total_items: 5 })
        .eq('id', newPlayer.id)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Erro ao atualizar jogador:', updateError.message);
        return false;
      }
      
      console.log(`   ✅ Jogador atualizado: total_items = ${updatedPlayer.total_items}`);
      
      // 4. Deletar o jogador
      console.log('   🗑️  Deletando jogador de teste...');
      const { error: deleteError } = await this.supabase
        .from('players')
        .delete()
        .eq('id', newPlayer.id);
      
      if (deleteError) {
        console.log('❌ Erro ao deletar jogador:', deleteError.message);
        return false;
      }
      
      console.log('   ✅ Jogador deletado com sucesso');
      
      return true;
    } catch (error) {
      console.log('❌ Erro no teste CRUD:', error.message);
      return false;
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testando performance...');
    
    try {
      const startTime = Date.now();
      
      // Fazer múltiplas consultas simultâneas
      const promises = [
        this.supabase.from('players').select('count', { count: 'exact', head: true }),
        this.supabase.from('items').select('count', { count: 'exact', head: true }),
        this.supabase.from('history').select('count', { count: 'exact', head: true }),
        this.supabase.from('system_config').select('count', { count: 'exact', head: true })
      ];
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`   ✅ 4 consultas simultâneas executadas em ${duration}ms`);
      
      if (duration < 1000) {
        console.log('   🚀 Performance excelente!');
      } else if (duration < 3000) {
        console.log('   👍 Performance boa');
      } else {
        console.log('   ⚠️  Performance pode ser melhorada');
      }
      
      return true;
    } catch (error) {
      console.log('❌ Erro no teste de performance:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Iniciando testes da API Supabase\n');
    
    const tests = [
      { name: 'Conexão', method: 'testConnection' },
      { name: 'Tabelas', method: 'testTables' },
      { name: 'CRUD', method: 'testCRUD' },
      { name: 'Performance', method: 'testPerformance' }
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
      try {
        const result = await this[test.method]();
        if (result) {
          passedTests++;
        }
      } catch (error) {
        console.log(`❌ Erro no teste ${test.name}:`, error.message);
      }
    }
    
    console.log('\n📊 RESULTADO DOS TESTES');
    console.log('========================');
    console.log(`✅ Testes aprovados: ${passedTests}/${tests.length}`);
    
    if (passedTests === tests.length) {
      console.log('\n🎉 Todos os testes passaram! Supabase está funcionando perfeitamente.');
      console.log('\n📋 Próximos passos:');
      console.log('   1. Configurar o frontend para usar a nova API');
      console.log('   2. Fazer deploy da aplicação');
      console.log('   3. Monitorar performance em produção');
    } else {
      console.log('\n⚠️  Alguns testes falharam. Verifique as configurações.');
    }
    
    return passedTests === tests.length;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  (async () => {
    try {
      const tester = new SupabaseDirectTest();
      const success = await tester.runAllTests();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('❌ Erro fatal:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = SupabaseDirectTest;