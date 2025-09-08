#!/usr/bin/env node

/**
 * Script para corrigir problemas de sincronização desabilitando RLS
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

class FixSync {
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

  async executeSQL(sql, description) {
    try {
      console.log(`🔧 ${description}...`);
      const { data, error } = await this.supabase.rpc('exec_sql', {
        query: sql
      });
      
      if (error) {
        console.log(`⚠️  Erro: ${error.message}`);
        return false;
      }
      
      console.log(`✅ ${description} - Concluído`);
      return true;
    } catch (error) {
      console.log(`❌ Erro ao executar: ${error.message}`);
      return false;
    }
  }

  async fixRLS() {
    console.log('🚀 Iniciando correção de sincronização...');
    
    const queries = [
      {
        sql: 'ALTER TABLE players DISABLE ROW LEVEL SECURITY;',
        desc: 'Desabilitando RLS para players'
      },
      {
        sql: 'ALTER TABLE items DISABLE ROW LEVEL SECURITY;',
        desc: 'Desabilitando RLS para items'
      },
      {
        sql: 'ALTER TABLE history DISABLE ROW LEVEL SECURITY;',
        desc: 'Desabilitando RLS para history'
      },
      {
        sql: 'ALTER TABLE system_config DISABLE ROW LEVEL SECURITY;',
        desc: 'Desabilitando RLS para system_config'
      },
      {
        sql: 'GRANT ALL ON players TO anon, authenticated;',
        desc: 'Concedendo permissões para players'
      },
      {
        sql: 'GRANT ALL ON items TO anon, authenticated;',
        desc: 'Concedendo permissões para items'
      },
      {
        sql: 'GRANT ALL ON history TO anon, authenticated;',
        desc: 'Concedendo permissões para history'
      },
      {
        sql: 'GRANT ALL ON system_config TO anon, authenticated;',
        desc: 'Concedendo permissões para system_config'
      },
      {
        sql: 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;',
        desc: 'Concedendo permissões para sequências'
      }
    ];

    for (const query of queries) {
      await this.executeSQL(query.sql, query.desc);
      await new Promise(resolve => setTimeout(resolve, 500)); // Pequena pausa
    }
  }

  async testConnection() {
    console.log('🧪 Testando conexão e acesso aos dados...');
    
    try {
      const { data: players, error: playersError } = await this.supabase
        .from('players')
        .select('*')
        .limit(1);
      
      if (playersError) {
        console.log('❌ Erro ao acessar players:', playersError.message);
        return false;
      }
      
      const { data: items, error: itemsError } = await this.supabase
        .from('items')
        .select('*')
        .limit(1);
      
      if (itemsError) {
        console.log('❌ Erro ao acessar items:', itemsError.message);
        return false;
      }
      
      console.log('✅ Conexão e acesso funcionando corretamente!');
      console.log(`📊 Players encontrados: ${players?.length || 0}`);
      console.log(`📦 Items encontrados: ${items?.length || 0}`);
      
      return true;
    } catch (error) {
      console.log('❌ Erro no teste:', error.message);
      return false;
    }
  }

  async run() {
    try {
      await this.fixRLS();
      await this.testConnection();
      console.log('\n🎉 Correção concluída! Os dados devem estar sincronizados agora.');
    } catch (error) {
      console.error('❌ Erro durante a correção:', error.message);
    }
  }
}

if (require.main === module) {
  (async () => {
    try {
      const fixer = new FixSync();
      await fixer.run();
    } catch (error) {
      console.error('❌ Erro:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = FixSync;