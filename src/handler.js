'use strict';

const tf = require('@tensorflow/tfjs-node');
const { v4: uuidv4 } = require('uuid');
const { getModel } = require('./loadModel');
const { storeData, getAllData } = require('./storeData');

/**
 * Preprocess gambar dari buffer ke tensor yang siap diinferensi
 * Model: MobileNetV3Large — input 224x224x3, nilai float32
 * Tidak perlu normalisasi manual karena model sudah include rescaling layer
 */
const preprocessImage = (imageBuffer) => {
  // Decode tanpa memaksa channel — supaya bisa validasi format gambar
  const tensor = tf.node.decodeImage(imageBuffer);

  // Validasi: hanya terima gambar RGB (3 channel)
  // Grayscale (1 channel) atau format aneh → throw → 400
  const channels = tensor.shape[2];
  if (channels !== 3) {
    tensor.dispose();
    throw new Error(`Invalid image: expected 3 channels (RGB), got ${channels}`);
  }

  // Resize ke 224x224
  const resized = tf.image.resizeBilinear(tensor, [224, 224]);

  // Cast ke float32 (nilai 0-255, model akan rescale sendiri)
  const casted = resized.toFloat();

  // Expand dims → [1, 224, 224, 3]
  const batched = casted.expandDims(0);

  // Cleanup tensor sementara
  tensor.dispose();
  resized.dispose();
  casted.dispose();

  return batched;
};


/**
 * POST /predict
 */
const predictHandler = async (request, h) => {
  const { image } = request.payload;

  // Validasi: harus ada file image
  if (!image) {
    return h
      .response({
        status: 'fail',
        message: 'Terjadi kesalahan dalam melakukan prediksi',
      })
      .code(400);
  }

  try {
    // Baca buffer dari stream
    const chunks = [];
    for await (const chunk of image) {
      chunks.push(chunk);
    }
    const imageBuffer = Buffer.concat(chunks);

    // Validasi ulang ukuran (double-check, seharusnya sudah ditangani Hapi)
    if (imageBuffer.length > 1000000) {
      return h
        .response({
          status: 'fail',
          message: 'Payload content length greater than maximum allowed: 1000000',
        })
        .code(413);
    }

    // Preprocess dan prediksi
    const model = getModel();
    const inputTensor = preprocessImage(imageBuffer);

    let outputTensor;
    try {
      outputTensor = model.predict(inputTensor);
    } finally {
      inputTensor.dispose();
    }

    const [score] = await outputTensor.data();
    outputTensor.dispose();

    // score > 0.5 → Cancer, sebaliknya → Non-cancer
    const isCancer = score > 0.5;
    const result = isCancer ? 'Cancer' : 'Non-cancer';
    const suggestion = isCancer
      ? 'Segera periksa ke dokter!'
      : 'Penyakit kanker tidak terdeteksi.';

    // Generate ID dan timestamp
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const data = { id, result, suggestion, createdAt };

    // Simpan ke Firestore
    await storeData(data);

    return h
      .response({
        status: 'success',
        message: 'Model is predicted successfully',
        data,
      })
      .code(201);
  } catch (error) {
    console.error('Prediction error:', error);
    return h
      .response({
        status: 'fail',
        message: 'Terjadi kesalahan dalam melakukan prediksi',
      })
      .code(400);
  }
};

/**
 * GET /predict/histories
 */
const getHistoriesHandler = async (request, h) => {
  try {
    const data = await getAllData();
    return h
      .response({
        status: 'success',
        data,
      })
      .code(200);
  } catch (error) {
    console.error('Get histories error:', error);
    return h
      .response({
        status: 'fail',
        message: 'Gagal mengambil data riwayat prediksi',
      })
      .code(500);
  }
};

module.exports = { predictHandler, getHistoriesHandler };
