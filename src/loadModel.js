'use strict';

const tf = require('@tensorflow/tfjs-node');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

const BUCKET_NAME = process.env.MODEL_BUCKET || 'submissionmlgc-hilmibisri-model';
const MODEL_PREFIX = process.env.MODEL_PATH
  ? path.dirname(process.env.MODEL_PATH)
  : 'models';

let model = null;

const downloadModelFromGCS = async () => {
  const storage = new Storage();
  const bucket = storage.bucket(BUCKET_NAME);
  const tmpDir = '/tmp/model';

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Coba prefix 'models/' dulu, fallback ke root bucket
  let files = [];
  const prefixes = [MODEL_PREFIX + '/', ''];

  for (const prefix of prefixes) {
    console.log(`[loadModel] Trying prefix: "${prefix || '(root)'}"`);
    const [result] = await bucket.getFiles({ prefix });
    const modelFiles = result.filter(f =>
      f.name.endsWith('.json') || f.name.endsWith('.bin')
    );
    if (modelFiles.length > 0) {
      files = modelFiles;
      console.log(`[loadModel] Found ${files.length} model files with prefix "${prefix || '(root)'}"`);
      break;
    }
  }

  if (files.length === 0) {
    throw new Error(`No model files found in bucket: ${BUCKET_NAME}`);
  }

  for (const file of files) {
    const filename = path.basename(file.name);
    const dest = path.join(tmpDir, filename);
    console.log(`[loadModel] Downloading: ${file.name} -> ${dest}`);
    await file.download({ destination: dest });
  }

  console.log(`[loadModel] ✅ All model files downloaded!`);
  return `file://${tmpDir}/model.json`;
};


const loadModel = async () => {
  try {
    const localModelPath = await downloadModelFromGCS();
    console.log(`[loadModel] Loading model from: ${localModelPath}`);
    model = await tf.loadGraphModel(localModelPath);
    console.log('[loadModel] ✅ Model loaded successfully!');
  } catch (err) {
    console.error('[loadModel] ❌ Failed to load model:', err.message);
    throw err;
  }

  return model;
};

const getModel = () => {
  if (!model) throw new Error('Model not loaded yet!');
  return model;
};

module.exports = { loadModel, getModel };
