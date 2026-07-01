'use strict';

const Hapi = require('@hapi/hapi');
const { loadModel } = require('./loadModel');
const { predictHandler, getHistoriesHandler } = require('./handler');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // Konfigurasi payload maksimal 1MB untuk route predict
  server.route([
    {
      method: 'POST',
      path: '/predict',
      options: {
        payload: {
          allow: 'multipart/form-data',
          multipart: true,
          maxBytes: 1000000, // 1MB
          output: 'stream',
        },
      },
      handler: predictHandler,
    },
    {
      method: 'GET',
      path: '/predict/histories',
      handler: getHistoriesHandler,
    },
  ]);

  // Handle error payload > 1MB dengan pesan custom
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;

    if (response.isBoom) {
      const { statusCode } = response.output;

      // Payload terlalu besar
      if (statusCode === 413) {
        return h
          .response({
            status: 'fail',
            message: 'Payload content length greater than maximum allowed: 1000000',
          })
          .code(413);
      }
    }

    return h.continue;
  });

  // Load model sebelum server start
  console.log('Loading ML model...');
  await loadModel();
  console.log('Model loaded successfully!');

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
