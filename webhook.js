// Endpoint para recibir webhooks de Notion (requiere servidor)
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.post('/notion-webhook', async (req, res) => {
  // Trigger GitHub Action
  await axios.post(`https://api.github.com/repos/TU_USUARIO/TU_REPO/dispatches`, {
    event_type: 'notion-updated'
  }, {
    headers: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  res.status(200).send('OK');
});

app.listen(3000);
