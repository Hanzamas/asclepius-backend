'use strict';

const tf = require('@tensorflow/tfjs-node');

const BUCKET_NAME = process.env.MODEL_BUCKET || 'submissionmlgc-hilmibisri-model';
const MODEL_PATH = process.env.MODEL_PATH || 'models/model.json';

let model = null;

const loadModel = async () => {
  const gcsPath = `gs://${BUCKET_NAME}/${MODEL_PATH}`;
  console.log(`[loadModel] Loading model from: ${gcsPath}`);
  console.log(`[loadModel] PROJECT: ${process.env.GOOGLE_CLOUD_PROJECT}`);

  try {
    model = await tf.loadGraphModel(gcsPath);
    console.log('[loadModel] ✅ Model loaded from GCS successfully!');
    console.log('[loadModel] Input shape:', model.inputs[0]?.shape);
  } catch (err) {
    console.error('[loadModel] ❌ Failed to load from GCS:', err.message);

    // Fallback ke local model
    const path = require('path');
    const localPath = `file://${path.join(__dirname, '../model/model.json')}`;
    console.log(`[loadModel] Trying local fallback: ${localPath}`);

    try {
      model = await tf.loadGraphModel(localPath);
      console.log('[loadModel] ✅ Model loaded from local!');
    } catch (localErr) {
      console.error('[loadModel] ❌ Local fallback also failed:', localErr.message);
      throw new Error('Cannot load model from GCS or local: ' + localErr.message);
    }
  }

  return model;
};

const getModel = () => {
  if (!model) throw new Error('Model not loaded yet!');
  return model;
};

module.exports = { loadModel, getModel };
