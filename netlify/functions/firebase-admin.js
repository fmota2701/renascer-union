// Configuração do Firebase Admin SDK para funções Netlify
const admin = require('firebase-admin');

// Inicializar Firebase Admin apenas se ainda não foi inicializado
if (!admin.apps.length) {
  // Debug logs
  console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
  console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
  console.log('FIREBASE_PRIVATE_KEY_BASE64 exists:', !!process.env.FIREBASE_PRIVATE_KEY_BASE64);
  
  // Configuração simplificada usando apenas as variáveis essenciais
  let privateKey;
  if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
    console.log('Using base64 decoded private key');
  } else if (process.env.FIREBASE_PRIVATE_KEY) {
    privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    console.log('Using direct private key');
  }
  
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL
  };
  
  console.log('Service account configured with:', {
    project_id: serviceAccount.project_id,
    client_email: serviceAccount.client_email,
    private_key_length: serviceAccount.private_key?.length
  });

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };