const express = require('express');
const axios = require('axios');

const app = express();
const port = 9696; // Puedes cambiar el puerto si es necesario

const BEARER_TOKEN = 'uniciasas'; // Reemplaza con tu token secreto
const BASIC_AUTH_USER = 'admin'; // Reemplaza con tu usuario
const BASIC_AUTH_PASS = 'admin'; // Reemplaza con tu contraseña

// Middleware para verificar la autenticación
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token === BEARER_TOKEN) {
        return next();
      }
    } else if (authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');
      if (username === BASIC_AUTH_USER && password === BASIC_AUTH_PASS) {
        return next();
      }
    }
  }

  res.status(403).json({ error: 'Acceso Denegado: Validar administrador UNICIA SAS' }); // Respuesta personalizada
});

// Proxy para reenviar solicitudes al servidor HAPI FHIR
app.use('/fhir', (req, res) => {
  const url = `http://192.168.162.23:8080${req.originalUrl}`; // Asegúrate de que la URL sea correcta
  axios({
    method: req.method,
    url: url,
    data: req.body,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': req.headers.authorization, // Reenviar el encabezado de autorización
    },
  })
  .then(response => {
    res.status(response.status).send(response.data);
  })
  .catch(error => {
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).send('Internal Server Error');
    }
  });
});

app.listen(port, () => {
  console.log(`API intermedia escuchando en http://localhost:${port}`);
});
