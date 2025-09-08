#!/usr/bin/env node

/**
 * Script para criar as tabelas no Supabase
 * Execute: node setup-supabase-tables.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class SupabaseSetup {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('❌ Credenciais do Supabase não encontradas no arquivo .env');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async executeSQLFile(filePath) {
    try {
      console.log(`📖 Lendo arquivo SQL: ${filePath}`);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Dividir o SQL em comandos individuais
      const sqlCommands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
      
      console.log(`🔧 Executando ${sqlCommands.length} comandos SQL...`);
      
      for (let i = 0; i < sqlCommands.length; i++) {
        const command = sqlCommands[i];
        console.log(`   [${i + 1}/${sqlCommands.length}] Executando comando...`);
        
        const { data, error } = await this.supabase.rpc('exec_sql', {
          sql_query: command
        });
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          console.error(`   SQL: ${command.substring(0, 100)}...`);
          // Continuar com os próximos comandos
        } else {
          console.log(`   ✅ Comando ${i + 1} executado com sucesso`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao executar arquivo SQL:', error.message);
      return false;
    }
  }

  async createTables() {
    console.log('🚀 Iniciando configuração das tabelas do Supabase...');
    console.log(`📍 URL: ${this.supabaseUrl}`);
    
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Arquivo não encontrado: ${schemaPath}`);
      return false;
    }
    
    const success = await this.executeSQLFile(schemaPath);
    
    if (success) {
      console.log('\n✅ Configuração das tabelas concluída!');
      console.log('\n📋 Próximos passos:');
      console.log('   1. Verificar as tabelas no painel do Supabase');
      console.log('   2. Executar a migração de dados: node migrate-to-supabase.js');
      console.log('   3. Testar a API: node test-supabase.js');
    } else {
      console.log('\n❌ Configuração das tabelas falhou!');
      console.log('\n🔧 Soluções:');
      console.log('   1. Verifique as credenciais no arquivo .env');
      console.log('   2. Execute os comandos SQL manualmente no painel do Supabase');
      console.log('   3. Verifique se o projeto Supabase está ativo');
    }
    
    return success;
  }

  async testConnection() {
    try {
      console.log('🔍 Testando conexão com o Supabase...');
      
      const { data, error } = await this.supabase
        .from('players')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log('⚠️  Tabelas ainda não existem (normal na primeira execução)');
        return true; // Conexão OK, tabelas não existem ainda
      }
      
      console.log('✅ Conexão com Supabase estabelecida!');
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão:', error.message);
      return false;
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  (async () => {
    try {
      const setup = new SupabaseSetup();
      
      const connectionOk = await setup.testConnection();
      if (!connectionOk) {
        process.exit(1);
      }
      
      const success = await setup.createTables();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('❌ Erro fatal:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = SupabaseSetup;