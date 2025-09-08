#!/usr/bin/env node

/**
 * Script de Migração: Google Sheets → Supabase
 * 
 * Este script migra todos os dados do Google Sheets para o Supabase
 * Executa: node migrate-to-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service key para operações admin
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração Google Sheets
const SHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
const serviceAccountAuth = new JWT({
  email: serviceAccountKey.client_email,
  key: serviceAccountKey.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

class DataMigrator {
  constructor() {
    this.doc = null;
    this.stats = {
      players: { migrated: 0, errors: 0 },
      items: { migrated: 0, errors: 0 },
      history: { migrated: 0, errors: 0 }
    };
  }

  async initialize() {
    console.log('🚀 Iniciando migração Google Sheets → Supabase\n');
    
    // Conectar ao Google Sheets
    this.doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await this.doc.loadInfo();
    console.log(`📊 Planilha carregada: ${this.doc.title}`);
    
    // Testar conexão Supabase
    const { data, error } = await supabase.from('system_config').select('*').limit(1);
    if (error) {
      throw new Error(`Erro conexão Supabase: ${error.message}`);
    }
    console.log('✅ Conexão Supabase OK\n');
  }

  async migratePlayersData() {
    console.log('👥 Migrando dados dos jogadores...');
    
    try {
      const sheet = this.doc.sheetsByTitle['Players'] || this.doc.sheetsByTitle['Jogadores'];
      if (!sheet) {
        console.log('⚠️  Aba de jogadores não encontrada');
        return;
      }

      const rows = await sheet.getRows();
      console.log(`   Encontrados ${rows.length} jogadores`);

      for (const row of rows) {
        try {
          const playerData = {
            name: row.get('Nome') || row.get('Name') || row.get('Player'),
            total_items: parseInt(row.get('Total') || row.get('TotalItens') || '0'),
            last_distribution_date: this.parseDate(row.get('UltimaDistribuicao') || row.get('LastDistribution')),
            status: 'active'
          };

          if (!playerData.name) {
            console.log(`   ⚠️  Jogador sem nome ignorado`);
            continue;
          }

          const { error } = await supabase
            .from('players')
            .insert(playerData);

          if (error) {
            console.log(`   ❌ Erro ao inserir ${playerData.name}: ${error.message}`);
            this.stats.players.errors++;
          } else {
            console.log(`   ✅ ${playerData.name} migrado`);
            this.stats.players.migrated++;
          }
        } catch (err) {
          console.log(`   ❌ Erro processando linha: ${err.message}`);
          this.stats.players.errors++;
        }
      }
    } catch (error) {
      console.log(`❌ Erro na migração de jogadores: ${error.message}`);
    }
  }

  async migrateItemsData() {
    console.log('\n🎁 Migrando dados dos itens...');
    
    try {
      const sheet = this.doc.sheetsByTitle['Items'] || this.doc.sheetsByTitle['Itens'];
      if (!sheet) {
        console.log('⚠️  Aba de itens não encontrada');
        return;
      }

      const rows = await sheet.getRows();
      console.log(`   Encontrados ${rows.length} itens`);

      for (const row of rows) {
        try {
          const itemData = {
            name: row.get('Nome') || row.get('Name') || row.get('Item'),
            category: row.get('Categoria') || row.get('Category') || 'Geral',
            rarity: row.get('Raridade') || row.get('Rarity') || 'Comum',
            value: parseInt(row.get('Valor') || row.get('Value') || '0'),
            description: row.get('Descricao') || row.get('Description') || '',
            available_quantity: parseInt(row.get('Quantidade') || row.get('Quantity') || '0'),
            total_distributed: parseInt(row.get('Distribuidos') || row.get('Distributed') || '0')
          };

          if (!itemData.name) {
            console.log(`   ⚠️  Item sem nome ignorado`);
            continue;
          }

          const { error } = await supabase
            .from('items')
            .insert(itemData);

          if (error) {
            console.log(`   ❌ Erro ao inserir ${itemData.name}: ${error.message}`);
            this.stats.items.errors++;
          } else {
            console.log(`   ✅ ${itemData.name} migrado`);
            this.stats.items.migrated++;
          }
        } catch (err) {
          console.log(`   ❌ Erro processando linha: ${err.message}`);
          this.stats.items.errors++;
        }
      }
    } catch (error) {
      console.log(`❌ Erro na migração de itens: ${error.message}`);
    }
  }

  async migrateHistoryData() {
    console.log('\n📜 Migrando histórico de distribuições...');
    
    try {
      const sheet = this.doc.sheetsByTitle['History'] || this.doc.sheetsByTitle['Historico'];
      if (!sheet) {
        console.log('⚠️  Aba de histórico não encontrada');
        return;
      }

      const rows = await sheet.getRows();
      console.log(`   Encontrados ${rows.length} registros de histórico`);

      // Buscar IDs dos jogadores e itens para referência
      const { data: players } = await supabase.from('players').select('id, name');
      const { data: items } = await supabase.from('items').select('id, name');
      
      const playerMap = new Map(players?.map(p => [p.name, p.id]) || []);
      const itemMap = new Map(items?.map(i => [i.name, i.id]) || []);

      for (const row of rows) {
        try {
          const playerName = row.get('Jogador') || row.get('Player');
          const itemName = row.get('Item') || row.get('Nome');
          
          const playerId = playerMap.get(playerName);
          const itemId = itemMap.get(itemName);

          if (!playerId || !itemId) {
            console.log(`   ⚠️  Referência não encontrada: ${playerName} -> ${itemName}`);
            continue;
          }

          const historyData = {
            player_id: playerId,
            item_id: itemId,
            quantity: parseInt(row.get('Quantidade') || row.get('Quantity') || '1'),
            distribution_date: this.parseDate(row.get('Data') || row.get('Date')) || new Date(),
            distribution_type: row.get('Tipo') || row.get('Type') || 'manual',
            notes: row.get('Observacoes') || row.get('Notes') || ''
          };

          const { error } = await supabase
            .from('history')
            .insert(historyData);

          if (error) {
            console.log(`   ❌ Erro ao inserir histórico: ${error.message}`);
            this.stats.history.errors++;
          } else {
            console.log(`   ✅ ${playerName} -> ${itemName} migrado`);
            this.stats.history.migrated++;
          }
        } catch (err) {
          console.log(`   ❌ Erro processando linha: ${err.message}`);
          this.stats.history.errors++;
        }
      }
    } catch (error) {
      console.log(`❌ Erro na migração de histórico: ${error.message}`);
    }
  }

  parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Tentar diferentes formatos de data
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          // DD/MM/YYYY
          return new Date(match[3], match[2] - 1, match[1]);
        } else {
          // YYYY-MM-DD
          return new Date(match[1], match[2] - 1, match[3]);
        }
      }
    }

    // Tentar parsing direto
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  async updateSystemConfig() {
    console.log('\n⚙️  Atualizando configurações do sistema...');
    
    const { error } = await supabase
      .from('system_config')
      .update({ value: new Date().toISOString() })
      .eq('key', 'last_sync_date');

    if (error) {
      console.log(`❌ Erro ao atualizar config: ${error.message}`);
    } else {
      console.log('✅ Configurações atualizadas');
    }
  }

  printStats() {
    console.log('\n📊 RESUMO DA MIGRAÇÃO');
    console.log('========================');
    console.log(`👥 Jogadores: ${this.stats.players.migrated} migrados, ${this.stats.players.errors} erros`);
    console.log(`🎁 Itens: ${this.stats.items.migrated} migrados, ${this.stats.items.errors} erros`);
    console.log(`📜 Histórico: ${this.stats.history.migrated} migrados, ${this.stats.history.errors} erros`);
    
    const total = this.stats.players.migrated + this.stats.items.migrated + this.stats.history.migrated;
    const totalErrors = this.stats.players.errors + this.stats.items.errors + this.stats.history.errors;
    
    console.log(`\n✅ Total migrado: ${total} registros`);
    if (totalErrors > 0) {
      console.log(`⚠️  Total de erros: ${totalErrors}`);
    }
    console.log('\n🎉 Migração concluída!');
  }

  async run() {
    try {
      await this.initialize();
      await this.migratePlayersData();
      await this.migrateItemsData();
      await this.migrateHistoryData();
      await this.updateSystemConfig();
      this.printStats();
    } catch (error) {
      console.error('💥 Erro fatal na migração:', error.message);
      process.exit(1);
    }
  }
}

// Executar migração
if (require.main === module) {
  const migrator = new DataMigrator();
  migrator.run();
}

module.exports = DataMigrator;