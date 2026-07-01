'use strict';

const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'submissionmlgc-hilmibisri',
});

const COLLECTION = 'predictions';

/**
 * Simpan data prediksi ke Firestore
 * @param {object} data - { id, result, suggestion, createdAt }
 */
const storeData = async (data) => {
  const docRef = db.collection(COLLECTION).doc(data.id);
  await docRef.set(data);
  return data;
};

/**
 * Ambil semua data prediksi dari Firestore
 * @returns {Array} array of prediction documents
 */
const getAllData = async () => {
  const snapshot = await db.collection(COLLECTION).get();
  const data = [];
  snapshot.forEach((doc) => {
    data.push({
      id: doc.id,
      history: doc.data(),
    });
  });
  return data;
};

module.exports = { storeData, getAllData };
