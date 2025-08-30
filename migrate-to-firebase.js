// Script para migrar dados do db.json para Firebase Firestore
require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuração do Firebase Admin usando variáveis de ambiente
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateData() {
  try {
    // Ler dados do db.json
    const dbPath = path.join(__dirname, 'db.json');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    console.log('Iniciando migração dos dados...');
    
    // Migrar players
    console.log('Migrando players...');
    const playersCollection = db.collection('players');
    for (const player of data.players) {
      await playersCollection.doc(player.id).set({
        nick: player.nick,
        class: player.class || null,
        level: player.level || null,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(player.createdAt)),
        order: player.order
      });
      console.log(`Player ${player.nick} migrado`);
    }
    
    // Migrar items
    console.log('Migrando items...');
    const itemsCollection = db.collection('items');
    for (const item of data.items) {
      await itemsCollection.doc(item.id).set({
        name: item.name,
        description: item.description,
        category: item.category,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(item.createdAt)),
        updatedAt: item.updatedAt ? admin.firestore.Timestamp.fromDate(new Date(item.updatedAt)) : null,
        order: item.order
      });
      console.log(`Item ${item.name} migrado`);
    }
    
    // Migrar distribution
    console.log('Migrando distribution...');
    const distributionCollection = db.collection('distribution');
    for (const dist of data.distribution) {
      await distributionCollection.doc(dist.id).set({
        playerId: dist.playerId,
        itemId: dist.itemId,
        quantity: dist.quantity,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(dist.createdAt))
      });
      console.log(`Distribuição ${dist.id} migrada`);
    }
    
    console.log('Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro durante a migração:', error);
  }
}

// Executar migração apenas se chamado diretamente
if (require.main === module) {
  migrateData().then(() => {
    console.log('Script de migração finalizado');
    process.exit(0);
  }).catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { migrateData };