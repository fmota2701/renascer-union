#!/usr/bin/env node

/**
 * Script alternativo para criar as tabelas no Supabase
 * Este script executa comandos SQL individuais diretamente
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class SupabaseDirectSetup {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('❌ Credenciais do Supabase não encontradas no arquivo .env');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async createTablesDirectly() {
    console.log('🚀 Criando tabelas diretamente no Supabase...');
    
    try {
      // 1. Criar tabela players
      console.log('📋 Criando tabela players...');
      const { error: playersError } = await this.supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS players (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255),
            total_items INTEGER DEFAULT 0,
            last_distribution TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (playersError) {
        console.log('⚠️  Erro na tabela players (pode já existir):', playersError.message);
      } else {
        console.log('✅ Tabela players criada!');
      }

      // 2. Criar tabela items
      console.log('📋 Criando tabela items...');
      const { error: itemsError } = await this.supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            rarity VARCHAR(50) DEFAULT 'common',
            available BOOLEAN DEFAULT true,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (itemsError) {
        console.log('⚠️  Erro na tabela items (pode já existir):', itemsError.message);
      } else {
        console.log('✅ Tabela items criada!');
      }

      // 3. Criar tabela history
      console.log('📋 Criando tabela history...');
      const { error: historyError } = await this.supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS history (
            id SERIAL PRIMARY KEY,
            player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
            item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
            quantity INTEGER DEFAULT 1,
            distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT
          );
        `
      });
      
      if (historyError) {
        console.log('⚠️  Erro na tabela history (pode já existir):', historyError.message);
      } else {
        console.log('✅ Tabela history criada!');
      }

      // 4. Criar tabela system_config
      console.log('📋 Criando tabela system_config...');
      const { error: configError } = await this.supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS system_config (
            id SERIAL PRIMARY KEY,
            config_key VARCHAR(255) NOT NULL UNIQUE,
            config_value TEXT,
            description TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (configError) {
        console.log('⚠️  Erro na tabela system_config (pode já existir):', configError.message);
      } else {
        console.log('✅ Tabela system_config criada!');
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao criar tabelas:', error.message);
      return false;
    }
  }

  async createBasicData() {
    console.log('\n📝 Inserindo dados básicos...');
    
    try {
      // Inserir configurações básicas
      const { error: configError } = await this.supabase
        .from('system_config')
        .upsert([
          {
            config_key: 'daily_distribution_limit',
            config_value: '30',
            description: 'Limite máximo de itens por distribuição diária'
          },
          {
            config_key: 'distributions_per_day',
            config_value: '2',
            description: 'Número de distribuições por dia'
          },
          {
            config_key: 'last_sync',
            config_value: new Date().toISOString(),
            description: 'Última sincronização com o sistema'
          }
        ], { onConflict: 'config_key' });
      
      if (configError) {
        console.log('⚠️  Erro ao inserir configurações:', configError.message);
      } else {
        console.log('✅ Configurações básicas inseridas!');
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao inserir dados básicos:', error.message);
      return false;
    }
  }

  async testTables() {
    console.log('\n🔍 Testando tabelas criadas...');
    
    try {
      const tables = ['players', 'items', 'history', 'system_config'];
      
      for (const table of tables) {
        const { data, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Erro na tabela ${table}:`, error.message);
        } else {
          console.log(`✅ Tabela ${table} está funcionando!`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao testar tabelas:', error.message);
      return false;
    }
  }

  async setup() {
    console.log('🚀 Iniciando configuração direta do Supabase...');
    console.log(`📍 URL: ${this.supabaseUrl}`);
    
    const tablesCreated = await this.createTablesDirectly();
    if (!tablesCreated) {
      console.log('\n❌ Falha na criação das tabelas!');
      return false;
    }
    
    const dataInserted = await this.createBasicData();
    if (!dataInserted) {
      console.log('\n⚠️  Tabelas criadas, mas falha na inserção de dados básicos');
    }
    
    const tablesWorking = await this.testTables();
    if (!tablesWorking) {
      console.log('\n⚠️  Tabelas criadas, mas alguns testes falharam');
    }
    
    console.log('\n✅ Configuração concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Verificar as tabelas no painel do Supabase');
    console.log('   2. Executar a migração de dados: node migrate-to-supabase.js');
    console.log('   3. Testar a API: node test-supabase.js');
    
    return true;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  (async () => {
    try {
      const setup = new SupabaseDirectSetup();
      const success = await setup.setup();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('❌ Erro fatal:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = SupabaseDirectSetup;