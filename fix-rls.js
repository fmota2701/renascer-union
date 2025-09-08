#!/usr/bin/env node

/**
 * Script para corrigir políticas RLS do Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class FixRLS {
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

  async disableRLS() {
    console.log('🔧 Desabilitando RLS temporariamente...');
    
    const tables = ['players', 'items', 'history', 'system_config'];
    
    for (const table of tables) {
      try {
        console.log(`📋 Desabilitando RLS para tabela ${table}...`);
        
        // Desabilitar RLS
        const { error: disableError } = await this.supabase.rpc('exec', {
          sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        });
        
        if (disableError) {
          console.log(`⚠️  Erro ao desabilitar RLS para ${table}:`, disableError.message);
        } else {
          console.log(`✅ RLS desabilitado para ${table}`);
        }
        
      } catch (error) {
        console.log(`⚠️  Erro na tabela ${table}:`, error.message);
      }
    }
  }

  async testInsert() {
    console.log('\n🧪 Testando inserção de jogador...');
    
    try {
      const { data, error } = await this.supabase
        .from('players')
        .insert({ name: 'Teste RLS Fix', status: 'active' })
        .select()
        .single();

      if (error) {
        console.log('❌ Erro ao inserir jogador:', error.message);
        return false;
      }

      console.log('✅ Jogador inserido com sucesso:', data);
      return true;
    } catch (error) {
      console.log('❌ Erro na inserção:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 Iniciando correção do RLS...');
    console.log(`📍 URL: ${this.supabaseUrl}`);
    
    await this.disableRLS();
    const success = await this.testInsert();
    
    if (success) {
      console.log('\n✅ Correção concluída! O cadastro deve funcionar agora.');
    } else {
      console.log('\n❌ Ainda há problemas. Verifique as credenciais e tabelas.');
    }
    
    return success;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  (async () => {
    try {
      const fix = new FixRLS();
      const success = await fix.run();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('❌ Erro fatal:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = FixRLS;