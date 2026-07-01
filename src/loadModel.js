'use strict';

const tf = require('@tensorflow/tfjs-node');
const { Storage } = require('@google-cloud/storage');

// Nama bucket dan path model di Cloud Storage
// Sesuaikan dengan bucket Anda
const BUCKET_NAME = process.env.MODEL_BUCKET || 'submissionmlgc-hilmibisri-model';
const MODEL_PATH = process.env.MODEL_PATH || 'models/model.json';

let model = null;

const loadModel = async () => {
  try {
    // Coba load dari Cloud Storage GCS
    const gcsPath = `gs://${BUCKET_NAME}/${MODEL_PATH}`;
    console.log(`Loading model from: ${gcsPath}`);
    model = await tf.loadGraphModel(gcsPath);
    console.log('Model loaded from Cloud Storage!');
  } catch (err) {
    // Fallback: load model lokal (untuk development)
    console.warn('GCS load failed, trying local model:', err.message);
    try {
      const path = require('path');
      const localPath = `file://${path.join(__dirname, '../model/model.json')}`;
      console.log(`Loading model from local: ${localPath}`);
      model = await tf.loadGraphModel(localPath);
      console.log('Model loaded from local!');
    } catch (localErr) {
      console.error('Failed to load model from local too:', localErr.message);
      throw new Error('Failed to load model: ' + localErr.message);
    }
  }
  return model;
};

const getModel = () => {
  if (!model) {
    throw new Error('Model belum dimuat. Panggil loadModel() terlebih dahulu.');
  }
  return model;
};

module.exports = { loadModel, getModel };
