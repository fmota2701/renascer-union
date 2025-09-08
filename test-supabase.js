#!/usr/bin/env node

/**
 * Script de Teste da API Supabase
 * 
 * Este script testa todos os endpoints da nova API Supabase
 * Executa: node test-supabase.js
 */

const https = require('https');
const http = require('http');
require('dotenv').config();

class SupabaseAPITester {
  constructor() {
    this.baseUrl = 'http://localhost:8888/.netlify/functions/supabase-api';
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async makeRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + endpoint);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const jsonBody = JSON.parse(body);
            resolve({
              status: res.statusCode,
              data: jsonBody,
              headers: res.headers
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: body,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async runTest(name, testFn) {
    console.log(`\n🧪 Testando: ${name}`);
    
    try {
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(`   ✅ PASSOU (${duration}ms)`);
        if (result.message) {
          console.log(`   📝 ${result.message}`);
        }
        this.results.passed++;
      } else {
        console.log(`   ❌ FALHOU (${duration}ms)`);
        console.log(`   💥 ${result.error}`);
        this.results.failed++;
      }
      
      this.results.tests.push({
        name,
        success: result.success,
        duration,
        error: result.error || null
      });
      
    } catch (error) {
      console.log(`   💥 ERRO: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({
        name,
        success: false,
        duration: 0,
        error: error.message
      });
    }
  }

  async testGetPlayers() {
    return this.runTest('GET /players', async () => {
      const response = await this.makeRequest('GET', '/players');
      
      if (response.status !== 200) {
        return { success: false, error: `Status ${response.status}` };
      }
      
      if (!response.data.players || !Array.isArray(response.data.players)) {
        return { success: false, error: 'Resposta não contém array de players' };
      }
      
      return { 
        success: true, 
        message: `${response.data.players.length} jogadores encontrados` 
      };
    });
  }

  async testGetItems() {
    return this.runTest('GET /items', async () => {
      const response = await this.makeRequest('GET', '/items');
      
      if (response.status !== 200) {
        return { success: false, error: `Status ${response.status}` };
      }
      
      if (!response.data.items || !Array.isArray(response.data.items)) {
        return { success: false, error: 'Resposta não contém array de items' };
      }
      
      return { 
        success: true, 
        message: `${response.data.items.length} itens encontrados` 
      };
    });
  }

  async testGetHistory() {
    return this.runTest('GET /history', async () => {
      const response = await this.makeRequest('GET', '/history?limit=10');
      
      if (response.status !== 200) {
        return { success: false, error: `Status ${response.status}` };
      }
      
      if (!response.data.history || !Array.isArray(response.data.history)) {
        return { success: false, error: 'Resposta não contém array de history' };
      }
      
      return { 
        success: true, 
        message: `${response.data.history.length} registros de histórico encontrados` 
      };
    });
  }

  async testGetStats() {
    return this.runTest('GET /stats', async () => {
      const response = await this.makeRequest('GET', '/stats');
      
      if (response.status !== 200) {
        return { success: false, error: `Status ${response.status}` };
      }
      
      const requiredFields = ['players', 'items', 'distributions', 'system'];
      for (const field of requiredFields) {
        if (!response.data[field]) {
          return { success: false, error: `Campo '${field}' não encontrado nas estatísticas` };
        }
      }
      
      return { 
        success: true, 
        message: `Estatísticas completas: ${response.data.players.total} jogadores, ${response.data.items.total} itens` 
      };
    });
  }

  async testCreatePlayer() {
    return this.runTest('POST /players (criar jogador teste)', async () => {
      const testPlayer = {
        name: `Teste_${Date.now()}`,
        status: 'active'
      };
      
      const response = await this.makeRequest('POST', '/players', testPlayer);
      
      if (response.status !== 200) {
        return { success: false, error: `Status ${response.status}: ${JSON.stringify(response.data)}` };
      }
      
      if (!response.data.player || response.data.player.name !== testPlayer.name) {
        return { success: false, error: 'Jogador não foi criado corretamente' };
      }
      
      return { 
        success: true, 
        message: `Jogador '${response.data.player.name}' criado com ID ${response.data.player.id}` 
      };
    });
  }

  async testCreateItem() {
    return this.runTest('POST /items (criar item teste)', async () => {
      const testItem = {
        name: `Item_Teste_${Date.now()}`,
        category: 'Teste',
        rarity: 'Comum',
        available_quantity: 10
      };
      
      const response = await this.makeRequest('POST', '/items', testItem);
      
      if (response.status !== 200) {
        return { success: false, error: `Status ${response.status}: ${JSON.stringify(response.data)}` };
      }
      
      if (!response.data.item || response.data.item.name !== testItem.name) {
        return { success: false, error: 'Item não foi criado corretamente' };
      }
      
      return { 
        success: true, 
        message: `Item '${response.data.item.name}' criado com ID ${response.data.item.id}` 
      };
    });
  }

  async testSync() {
    return this.runTest('POST /sync', async () => {
      const response = await this.makeRequest('POST', '/sync', {});
      
      if (response.status !== 200) {
        return { success: false, error: `Status ${response.status}` };
      }
      
      if (!response.data.cache_cleared) {
        return { success: false, error: 'Cache não foi limpo' };
      }
      
      return { 
        success: true, 
        message: 'Sincronização realizada com sucesso' 
      };
    });
  }

  async testCheckUpdates() {
    return this.runTest('GET /check-updates', async () => {
      const response = await this.makeRequest('GET', '/check-updates');
      
      if (response.status !== 200) {
        return { success: false, error: `Status ${response.status}` };
      }
      
      const requiredFields = ['players', 'items', 'history'];
      for (const field of requiredFields) {
        if (!response.data[field]) {
          return { success: false, error: `Campo '${field}' não encontrado` };
        }
      }
      
      return { 
        success: true, 
        message: 'Check updates funcionando corretamente' 
      };
    });
  }

  async testPerformance() {
    return this.runTest('Teste de Performance (10 requisições)', async () => {
      const requests = [];
      const startTime = Date.now();
      
      // Fazer 10 requisições simultâneas
      for (let i = 0; i < 10; i++) {
        requests.push(this.makeRequest('GET', '/stats'));
      }
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / 10;
      
      // Verificar se todas as requisições foram bem-sucedidas
      const failedRequests = responses.filter(r => r.status !== 200);
      if (failedRequests.length > 0) {
        return { success: false, error: `${failedRequests.length} requisições falharam` };
      }
      
      // Verificar se a performance está boa (menos de 2 segundos por requisição em média)
      if (avgTime > 2000) {
        return { success: false, error: `Performance ruim: ${avgTime}ms por requisição` };
      }
      
      return { 
        success: true, 
        message: `${avgTime.toFixed(0)}ms por requisição (total: ${totalTime}ms)` 
      };
    });
  }

  async checkServerRunning() {
    console.log('🔍 Verificando se o servidor está rodando...');
    
    try {
      const response = await this.makeRequest('GET', '/stats');
      if (response.status === 200) {
        console.log('✅ Servidor está rodando!');
        return true;
      } else {
        console.log(`❌ Servidor retornou status ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Erro ao conectar: ${error.message}`);
      console.log('\n💡 Certifique-se de que o servidor está rodando:');
      console.log('   netlify dev');
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Iniciando testes da API Supabase\n');
    console.log(`📡 URL base: ${this.baseUrl}`);
    
    // Verificar se o servidor está rodando
    const serverRunning = await this.checkServerRunning();
    if (!serverRunning) {
      return;
    }
    
    // Executar todos os testes
    await this.testGetPlayers();
    await this.testGetItems();
    await this.testGetHistory();
    await this.testGetStats();
    await this.testCreatePlayer();
    await this.testCreateItem();
    await this.testSync();
    await this.testCheckUpdates();
    await this.testPerformance();
    
    // Mostrar resumo
    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 RESUMO DOS TESTES');
    console.log('====================');
    console.log(`✅ Passou: ${this.results.passed}`);
    console.log(`❌ Falhou: ${this.results.failed}`);
    console.log(`📈 Total: ${this.results.passed + this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Testes que falharam:');
      this.results.tests
        .filter(t => !t.success)
        .forEach(t => {
          console.log(`   • ${t.name}: ${t.error}`);
        });
    }
    
    const avgDuration = this.results.tests.reduce((sum, t) => sum + t.duration, 0) / this.results.tests.length;
    console.log(`\n⏱️  Tempo médio por teste: ${avgDuration.toFixed(0)}ms`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 Todos os testes passaram! API Supabase está funcionando perfeitamente!');
    } else {
      console.log('\n⚠️  Alguns testes falharam. Verifique a configuração do Supabase.');
    }
  }
}

// Executar testes
if (require.main === module) {
  const tester = new SupabaseAPITester();
  tester.runAllTests();
}

module.exports = SupabaseAPITester;