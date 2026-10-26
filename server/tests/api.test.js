import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/server.js';
import { Share } from '../src/models/Share.js';

let mongod;

describe('QuickClip Backend API Tests', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    mongod = await MongoMemoryServer.create({
      instance: {
        launchTimeout: 60000,
      },
    });
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  test('GET /api/health should return healthy status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.name, 'QuickClip API');
  });

  test('POST /api/clipboard should validate empty text', async () => {
    const res = await request(app)
      .post('/api/clipboard')
      .send({ text: '   ' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test('POST /api/clipboard should create a text share with a 6-digit code', async () => {
    const res = await request(app)
      .post('/api/clipboard')
      .send({ text: 'Hello from QuickClip automated test!' });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.code);
    assert.equal(res.body.data.code.length, 6);
    assert.ok(res.body.data.shareId);
    assert.ok(res.body.data.managementToken);

    // Retrieve via code
    const getRes = await request(app).get(`/api/clipboard/${res.body.data.code}`);
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.text, 'Hello from QuickClip automated test!');
  });

  test('GET /api/shares/:code should return metadata for existing share', async () => {
    // Create text share
    const createRes = await request(app)
      .post('/api/clipboard')
      .send({ text: 'Testing metadata endpoint' });

    const code = createRes.body.data.code;
    const res = await request(app).get(`/api/shares/${code}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.shareType, 'text');
    assert.equal(res.body.data.textContent, 'Testing metadata endpoint');
  });

  test('GET /api/shares/:code should return 404 for non-existent code', async () => {
    const res = await request(app).get('/api/shares/000000');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  test('POST /api/uploads/initiate should create an upload session', async () => {
    const res = await request(app)
      .post('/api/uploads/initiate')
      .send({
        filename: 'document.pdf',
        fileSize: 1024 * 50, // 50 KB
        mimeType: 'application/pdf',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.shareId);
    assert.ok(res.body.data.code);
    assert.equal(res.body.data.code.length, 6);
    assert.ok(res.body.data.managementToken);
  });

  test('Full file upload, verify, and download lifecycle', async () => {
    const fileContent = 'QuickClip Test File Content: ' + Date.now();
    const fileBuffer = Buffer.from(fileContent, 'utf-8');

    // 1. Initiate upload
    const initRes = await request(app)
      .post('/api/uploads/initiate')
      .send({
        filename: 'test-note.txt',
        fileSize: fileBuffer.length,
        mimeType: 'text/plain',
      });

    assert.equal(initRes.status, 201);
    const { shareId, code, storageKey, uploadSession } = initRes.body.data;
    assert.ok(uploadSession.uploadUrl);

    // 2. Stream upload file body to the returned local uploadUrl
    const uploadRes = await request(app)
      .put(uploadSession.uploadUrl)
      .set('Content-Type', 'text/plain')
      .send(fileBuffer);

    assert.equal(uploadRes.status, 200);

    // 3. Complete the upload
    const completeRes = await request(app)
      .post(`/api/uploads/${shareId}/complete`)
      .send({});

    assert.equal(completeRes.status, 200);
    assert.equal(completeRes.body.data.filename, 'test-note.txt');

    // 4. Download file using code and verify contents
    const downloadRes = await request(app)
      .get(`/api/shares/${code}/download`);

    assert.equal(downloadRes.status, 200);
    assert.equal(downloadRes.text, fileContent);
  });

  test('DELETE /api/shares/:id should prevent unauthorized deletion', async () => {
    const createRes = await request(app)
      .post('/api/clipboard')
      .send({ text: 'Secret text to delete' });

    const shareId = createRes.body.data.shareId;

    // Attempt without token
    const unauthRes = await request(app).delete(`/api/shares/${shareId}`);
    assert.equal(unauthRes.status, 401);

    // Attempt with invalid token
    const wrongTokenRes = await request(app)
      .delete(`/api/shares/${shareId}`)
      .set('x-management-token', 'wrong-token-12345');
    assert.equal(wrongTokenRes.status, 403);

    // Attempt with correct token
    const authRes = await request(app)
      .delete(`/api/shares/${shareId}`)
      .set('x-management-token', createRes.body.data.managementToken);
    assert.equal(authRes.status, 200);
    assert.equal(authRes.body.success, true);

    // Verify it is gone
    const checkRes = await request(app).get(`/api/shares/${createRes.body.data.code}`);
    assert.equal(checkRes.status, 404);
  });
});
