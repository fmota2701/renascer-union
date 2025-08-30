// API com Firebase Firestore
const { db } = require('./firebase-admin');

// Função para gerar ID único
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Função para converter Timestamp do Firestore para ISO string
function convertTimestamp(doc) {
  const data = doc.data();
  const result = { id: doc.id, ...data };
  
  // Converter timestamps para strings ISO
  if (data.createdAt && data.createdAt.toDate) {
    result.createdAt = data.createdAt.toDate().toISOString();
  }
  if (data.updatedAt && data.updatedAt.toDate) {
    result.updatedAt = data.updatedAt.toDate().toISOString();
  }
  
  return result;
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
    const pathParts = requestPath.split('/').filter(part => part !== '' && part !== 'api');
    const resource = pathParts[0];
    const id = pathParts[1];

    let responseBody;
    let statusCode = 200;

    switch (httpMethod) {
      case 'GET':
        if (resource === 'players') {
          if (id) {
            // Buscar jogador específico
            const playerDoc = await db.collection('players').doc(id).get();
            if (playerDoc.exists) {
              responseBody = convertTimestamp(playerDoc);
            } else {
              statusCode = 404;
              responseBody = { error: 'Player not found' };
            }
          } else {
            // Buscar todos os jogadores ordenados por 'order'
            const playersSnapshot = await db.collection('players').orderBy('order').get();
            responseBody = playersSnapshot.docs.map(doc => convertTimestamp(doc));
          }
        } else if (resource === 'items') {
          if (id) {
            // Buscar item específico
            const itemDoc = await db.collection('items').doc(id).get();
            if (itemDoc.exists) {
              responseBody = convertTimestamp(itemDoc);
            } else {
              statusCode = 404;
              responseBody = { error: 'Item not found' };
            }
          } else {
            // Buscar todos os itens ordenados por 'order'
            const itemsSnapshot = await db.collection('items').orderBy('order').get();
            responseBody = itemsSnapshot.docs.map(doc => convertTimestamp(doc));
          }
        } else if (resource === 'distribution') {
          if (id) {
            // Buscar distribuição específica
            const distDoc = await db.collection('distribution').doc(id).get();
            if (distDoc.exists) {
              responseBody = convertTimestamp(distDoc);
            } else {
              statusCode = 404;
              responseBody = { error: 'Distribution not found' };
            }
          } else {
            // Buscar todas as distribuições ordenadas por data de criação
            const distSnapshot = await db.collection('distribution').orderBy('createdAt', 'desc').get();
            responseBody = distSnapshot.docs.map(doc => convertTimestamp(doc));
          }
        } else {
          statusCode = 404;
          responseBody = { error: 'Resource not found' };
        }
        break;

      case 'POST':
        const postData = JSON.parse(body);
        if (resource === 'players') {
          const newPlayer = {
            ...postData,
            createdAt: new Date()
          };
          const docRef = await db.collection('players').add(newPlayer);
          const newDoc = await docRef.get();
          responseBody = convertTimestamp(newDoc);
          statusCode = 201;
        } else if (resource === 'items') {
          const newItem = {
            ...postData,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          const docRef = await db.collection('items').add(newItem);
          const newDoc = await docRef.get();
          responseBody = convertTimestamp(newDoc);
          statusCode = 201;
        } else if (resource === 'distribution') {
          const newDistribution = {
            ...postData,
            createdAt: new Date()
          };
          const docRef = await db.collection('distribution').add(newDistribution);
          const newDoc = await docRef.get();
          responseBody = convertTimestamp(newDoc);
          statusCode = 201;
        } else {
          statusCode = 404;
          responseBody = { error: 'Resource not found' };
        }
        break;

      case 'PUT':
        const putData = JSON.parse(body);
        if (resource === 'players' && id) {
          const playerRef = db.collection('players').doc(id);
          const playerDoc = await playerRef.get();
          if (playerDoc.exists) {
            await playerRef.update({
              ...putData,
              updatedAt: new Date()
            });
            const updatedDoc = await playerRef.get();
            responseBody = convertTimestamp(updatedDoc);
          } else {
            statusCode = 404;
            responseBody = { error: 'Player not found' };
          }
        } else if (resource === 'items' && id) {
          const itemRef = db.collection('items').doc(id);
          const itemDoc = await itemRef.get();
          if (itemDoc.exists) {
            await itemRef.update({
              ...putData,
              updatedAt: new Date()
            });
            const updatedDoc = await itemRef.get();
            responseBody = convertTimestamp(updatedDoc);
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
          const playerRef = db.collection('players').doc(id);
          const playerDoc = await playerRef.get();
          if (playerDoc.exists) {
            await playerRef.delete();
            responseBody = { message: 'Player deleted successfully' };
          } else {
            statusCode = 404;
            responseBody = { error: 'Player not found' };
          }
        } else if (resource === 'items' && id) {
          const itemRef = db.collection('items').doc(id);
          const itemDoc = await itemRef.get();
          if (itemDoc.exists) {
            await itemRef.delete();
            responseBody = { message: 'Item deleted successfully' };
          } else {
            statusCode = 404;
            responseBody = { error: 'Item not found' };
          }
        } else if (resource === 'distribution' && id) {
          const distRef = db.collection('distribution').doc(id);
          const distDoc = await distRef.get();
          if (distDoc.exists) {
            await distRef.delete();
            responseBody = { message: 'Distribution deleted successfully' };
          } else {
            statusCode = 404;
            responseBody = { error: 'Distribution not found' };
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
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};