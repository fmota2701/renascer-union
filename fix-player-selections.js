#!/usr/bin/env node

/**
 * Script para criar a tabela player_selections usando a API do Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class PlayerSelectionsTableFix {
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

  async createPlayerSelectionsTable() {
    console.log('🚀 Criando tabela player_selections...');
    
    try {
      // Primeiro, vamos verificar se a tabela já existe
      const { data: existingTable, error: checkError } = await this.supabase
        .from('player_selections')
        .select('*')
        .limit(1);
      
      if (!checkError) {
        console.log('✅ Tabela player_selections já existe!');
        return true;
      }
      
      console.log('📋 Tabela não existe, criando...');
      
      // Tentar inserir um registro de teste para forçar a criação da tabela
      const { data, error } = await this.supabase
        .from('player_selections')
        .insert({
          player_name: 'test_player',
          is_selected: false,
          selected_by: 'system',
          selected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.log('⚠️ Erro ao criar tabela via insert:', error.message);
        console.log('\n📝 Execute este SQL manualmente no Supabase SQL Editor:');
        console.log('\n--- COPIE E COLE NO SUPABASE SQL EDITOR ---\n');
        console.log(`CREATE TABLE IF NOT EXISTS player_selections (
  id SERIAL PRIMARY KEY,
  player_id INTEGER,
  player_name VARCHAR(255) NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  selected_by VARCHAR(255),
  selected_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_player_selections_player_name ON player_selections(player_name);
CREATE INDEX IF NOT EXISTS idx_player_selections_is_selected ON player_selections(is_selected);

-- RLS
ALTER TABLE player_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all operations on player_selections" ON player_selections FOR ALL USING (true);`);
        console.log('\n--- FIM DO SQL ---\n');
        return false;
      }
      
      console.log('✅ Tabela player_selections criada com sucesso!');
      
      // Remover o registro de teste
      await this.supabase
        .from('player_selections')
        .delete()
        .eq('player_name', 'test_player');
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao criar tabela:', error.message);
      return false;
    }
  }

  async testTable() {
    console.log('🔍 Testando tabela player_selections...');
    
    try {
      const { data, error } = await this.supabase
        .from('player_selections')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌ Erro ao testar tabela:', error.message);
        return false;
      }
      
      console.log('✅ Tabela player_selections está funcionando!');
      return true;
      
    } catch (error) {
      console.error('❌ Erro no teste:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 Iniciando correção da tabela player_selections...');
    
    const created = await this.createPlayerSelectionsTable();
    if (created) {
      await this.testTable();
      console.log('✅ Correção concluída!');
    } else {
      console.log('❌ Falha na correção. Execute o SQL manualmente.');
    }
  }
}

if (require.main === module) {
  (async () => {
    try {
      const fixer = new PlayerSelectionsTableFix();
      await fixer.run();
    } catch (error) {
      console.error('❌ Erro fatal:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = PlayerSelectionsTableFix;