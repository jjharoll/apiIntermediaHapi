const express = require('express');
const axios = require('axios');
const basicAuth = require('express-basic-auth');
const promClient = require('prom-client');

const app = express();
const port = 3000;
const fhirServerUrl = 'http://192.168.162.23:8080';
const BEARER_TOKEN = 'uniciasas'; // Reemplaza con tu token secreto

// Configuración de autenticación básica
const auth = basicAuth({
  users: { 'admin': 'admin' },
  challenge: true,
  unauthorizedResponse: 'Forbidden'
});

// Middleware de autenticación básica
app.use(auth);

// Middleware para verificar el token Bearer
const bearerAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.split(' ')[1] === BEARER_TOKEN) {
    next();
  } else {
    res.status(403).send('Forbidden');
  }
};

// Configuración de métricas de Prometheus
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Endpoint de métricas para Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Endpoint de proxy para HAPI FHIR server con verificación de token Bearer
app.use('/fhir', bearerAuth, async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${fhirServerUrl}/fhir${req.url}`,
      data: req.body,
      headers: {
        Authorization: req.headers.authorization
      }
    });
    res.status(response.status).send(response.data);
  } catch (error) {
    res.status(error.response ? error.response.status : 500).send(error.message);
  }
});

// Inicio del servidor
app.listen(port, () => {
  console.log(`Proxy server listening at http://192.168.162.23:${port}`);
});
