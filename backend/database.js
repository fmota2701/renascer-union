const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'guild_loot.db');
    this.db = null;
    this.init();
  }

  init() {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Erro ao conectar com o banco de dados:', err.message);
      } else {
        console.log('Conectado ao banco de dados SQLite.');
        this.createTables();
      }
    });
  }

  createTables() {
    const createPlayersTable = `
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        class TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        position INTEGER,
        loot_count INTEGER DEFAULT 0,
        last_loot_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createGuildDataTable = `
      CREATE TABLE IF NOT EXISTS guild_data (
        id INTEGER PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createLogsTable = `
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        player_id TEXT,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players (id)
      )
    `;

    this.db.serialize(() => {
      this.db.run(createPlayersTable);
      this.db.run(createGuildDataTable);
      this.db.run(createLogsTable);
    });
  }

  // Métodos para jogadores
  getPlayers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM players ORDER BY position ASC', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  addPlayer(player) {
    return new Promise((resolve, reject) => {
      const id = player.id || uuidv4();
      const { name, class: playerClass, active = 1, position = 0, loot_count = 0 } = player;
      
      const sql = `
        INSERT INTO players (id, name, class, active, position, loot_count)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [id, name, playerClass, active, position, loot_count], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, name, class: playerClass, active, position, loot_count });
        }
      });
    });
  }

  updatePlayer(id, updates) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      Object.keys(updates).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const sql = `UPDATE players SET ${fields.join(', ')} WHERE id = ?`;
      
      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...updates });
        }
      });
    });
  }

  deletePlayer(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM players WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deletedRows: this.changes });
        }
      });
    });
  }

  // Métodos para dados da guilda
  getGuildData() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT data FROM guild_data ORDER BY updated_at DESC LIMIT 1', (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          try {
            resolve(JSON.parse(row.data));
          } catch (parseErr) {
            reject(parseErr);
          }
        } else {
          // Retornar estrutura padrão se não houver dados
          resolve({
            players: [],
            config: {
              guildName: 'Minha Guilda',
              lootSystem: 'dkp',
              autoSave: true
            },
            lastUpdated: new Date().toISOString()
          });
        }
      });
    });
  }

  saveGuildData(data) {
    return new Promise((resolve, reject) => {
      const dataString = JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString()
      });
      
      // Primeiro, tentar atualizar
      this.db.run('UPDATE guild_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1', [dataString], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          // Se não atualizou nenhuma linha, inserir nova
          this.db.run('INSERT INTO guild_data (id, data) VALUES (1, ?)', [dataString], function(insertErr) {
            if (insertErr) {
              reject(insertErr);
            } else {
              resolve({ success: true });
            }
          });
        } else {
          resolve({ success: true });
        }
      }.bind(this));
    });
  }

  // Métodos para logs
  addLog(action, playerId = null, details = null) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const sql = 'INSERT INTO logs (id, action, player_id, details) VALUES (?, ?, ?, ?)';
      
      this.db.run(sql, [id, action, playerId, JSON.stringify(details)], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, action, playerId, details });
        }
      });
    });
  }

  getLogs(limit = 100) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT l.*, p.name as player_name 
        FROM logs l 
        LEFT JOIN players p ON l.player_id = p.id 
        ORDER BY l.timestamp DESC 
        LIMIT ?
      `;
      
      this.db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            ...row,
            details: row.details ? JSON.parse(row.details) : null
          })));
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Erro ao fechar banco de dados:', err.message);
        } else {
          console.log('Conexão com banco de dados fechada.');
        }
      });
    }
  }
}

module.exports = Database;