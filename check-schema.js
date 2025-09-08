#!/usr/bin/env node

/**
 * Script para verificar o schema das tabelas no Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class SchemaChecker {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async checkTableSchema(tableName) {
    console.log(`\n📋 Verificando schema da tabela: ${tableName}`);
    
    try {
      // Tentar inserir um registro vazio para ver quais colunas são obrigatórias
      const { data, error } = await this.supabase
        .from(tableName)
        .insert({})
        .select();
      
      if (error) {
        console.log(`   ℹ️  Erro esperado (mostra colunas obrigatórias): ${error.message}`);
      }
      
      // Tentar fazer uma consulta para ver a estrutura
      const { data: sampleData, error: selectError } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.log(`   ❌ Erro ao consultar: ${selectError.message}`);
      } else {
        console.log(`   ✅ Tabela acessível, ${sampleData?.length || 0} registros encontrados`);
        if (sampleData && sampleData.length > 0) {
          console.log(`   📝 Colunas encontradas:`, Object.keys(sampleData[0]));
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }

  async checkAllTables() {
    console.log('🔍 Verificando schema de todas as tabelas\n');
    
    const tables = ['players', 'items', 'history', 'system_config'];
    
    for (const table of tables) {
      await this.checkTableSchema(table);
    }
    
    console.log('\n✅ Verificação de schema concluída!');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  (async () => {
    try {
      const checker = new SchemaChecker();
      await checker.checkAllTables();
    } catch (error) {
      console.error('❌ Erro fatal:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = SchemaChecker;