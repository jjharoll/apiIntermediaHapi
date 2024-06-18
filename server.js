const express = require('express');
const axios = require('axios');
const basicAuth = require('express-basic-auth');
const promClient = require('prom-client');

const app = express();
const port = 3000;
const fhirServerUrl = 'http://192.168.162.23:8080';

// Configuración de autenticación básica
const auth = basicAuth({
  users: { 'admin': 'admin' },
  challenge: true,
  unauthorizedResponse: 'Acceso denegado. Contacte con Unicia SAS para obtener acceso.'
});

// Configuración de métricas de Prometheus
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Endpoint de métricas para Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Middleware de autenticación básica
app.use(auth);

// Middleware para manejar el proxy de solicitudes FHIR
app.use(async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${fhirServerUrl}${req.originalUrl}`,
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
