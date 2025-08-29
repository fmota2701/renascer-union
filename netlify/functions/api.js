const fs = require('fs');
const path = require('path');

// Caminho para o arquivo db.json
const dbPath = path.join(process.cwd(), 'db.json');

// Função para ler o banco de dados
function readDB() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler db.json:', error);
    return { players: [], items: [], distribution: [] };
  }
}

// Função para escrever no banco de dados
function writeDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao escrever db.json:', error);
    return false;
  }
}

// Função para gerar ID único
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

exports.handler = async (event, context) => {
  const { httpMethod, path: requestPath, body, queryStringParameters } = event;
  
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Responder a requisições OPTIONS (preflight)
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const db = readDB();
    const pathParts = requestPath.split('/').filter(part => part !== '' && part !== 'api');
    const resource = pathParts[0];
    const id = pathParts[1];

    let responseBody;
    let statusCode = 200;

    switch (httpMethod) {
      case 'GET':
        if (resource === 'players') {
          responseBody = id ? db.players.find(p => p.id === id) : db.players;
        } else if (resource === 'items') {
          responseBody = id ? db.items.find(i => i.id === id) : db.items;
        } else if (resource === 'distribution') {
          responseBody = id ? db.distribution.find(d => d.id === id) : db.distribution;
        } else {
          statusCode = 404;
          responseBody = { error: 'Resource not found' };
        }
        break;

      case 'POST':
        const postData = JSON.parse(body);
        if (resource === 'players') {
          const newPlayer = { ...postData, id: generateId() };
          db.players.push(newPlayer);
          writeDB(db);
          responseBody = newPlayer;
          statusCode = 201;
        } else if (resource === 'items') {
          const newItem = { ...postData, id: generateId() };
          db.items.push(newItem);
          writeDB(db);
          responseBody = newItem;
          statusCode = 201;
        } else if (resource === 'distribution') {
          const newDistribution = { ...postData, id: generateId() };
          db.distribution.push(newDistribution);
          writeDB(db);
          responseBody = newDistribution;
          statusCode = 201;
        } else {
          statusCode = 404;
          responseBody = { error: 'Resource not found' };
        }
        break;

      case 'PUT':
        const putData = JSON.parse(body);
        if (resource === 'players' && id) {
          const playerIndex = db.players.findIndex(p => p.id === id);
          if (playerIndex !== -1) {
            db.players[playerIndex] = { ...db.players[playerIndex], ...putData };
            writeDB(db);
            responseBody = db.players[playerIndex];
          } else {
            statusCode = 404;
            responseBody = { error: 'Player not found' };
          }
        } else if (resource === 'items' && id) {
          const itemIndex = db.items.findIndex(i => i.id === id);
          if (itemIndex !== -1) {
            db.items[itemIndex] = { ...db.items[itemIndex], ...putData };
            writeDB(db);
            responseBody = db.items[itemIndex];
          } else {
            statusCode = 404;
            responseBody = { error: 'Item not found' };
          }
        } else {
          statusCode = 404;
          responseBody = { error: 'Resource not found' };
        }
        break;

      case 'DELETE':
        if (resource === 'players' && id) {
          const playerIndex = db.players.findIndex(p => p.id === id);
          if (playerIndex !== -1) {
            db.players.splice(playerIndex, 1);
            writeDB(db);
            responseBody = { message: 'Player deleted successfully' };
          } else {
            statusCode = 404;
            responseBody = { error: 'Player not found' };
          }
        } else if (resource === 'items' && id) {
          const itemIndex = db.items.findIndex(i => i.id === id);
          if (itemIndex !== -1) {
            db.items.splice(itemIndex, 1);
            writeDB(db);
            responseBody = { message: 'Item deleted successfully' };
          } else {
            statusCode = 404;
            responseBody = { error: 'Item not found' };
          }
        } else {
          statusCode = 404;
          responseBody = { error: 'Resource not found' };
        }
        break;

      default:
        statusCode = 405;
        responseBody = { error: 'Method not allowed' };
    }

    return {
      statusCode,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseBody)
    };

  } catch (error) {
    console.error('Erro na função:', error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};