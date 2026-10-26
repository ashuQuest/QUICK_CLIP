import http from 'http';
import { app } from '../src/server.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

async function run() {
  console.log('--- Starting End-to-End Integration Verification ---');
  await connectDB();

  const server = app.listen(5001, async () => {
    console.log('Temporary verification server listening on port 5001');

    try {
      // Helper for JSON requests
      const requestJson = (options, data) => {
        return new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
              } catch (e) {
                resolve({ status: res.statusCode, headers: res.headers, raw: body });
              }
            });
          });
          req.on('error', reject);
          if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
          }
          req.end();
        });
      };

      // Helper for binary stream requests
      const putStream = (urlPath, buffer, contentType) => {
        return new Promise((resolve, reject) => {
          const req = http.request(
            {
              hostname: 'localhost',
              port: 5001,
              path: urlPath,
              method: 'PUT',
              headers: {
                'Content-Type': contentType,
                'Content-Length': buffer.length,
              },
            },
            (res) => {
              let body = '';
              res.on('data', (chunk) => (body += chunk));
              res.on('end', () => resolve({ status: res.statusCode, body }));
            }
          );
          req.on('error', reject);
          req.write(buffer);
          req.end();
        });
      };

      // 1. Health check
      console.log('1. Testing GET /api/health...');
      const health = await requestJson({ hostname: 'localhost', port: 5001, path: '/api/health', method: 'GET' });
      console.log('   Health Status:', health.status, health.data.status, 'Storage:', health.data.storageProvider);

      // 2. Text Clipboard Share
      console.log('2. Testing POST /api/clipboard...');
      const textShare = await requestJson(
        {
          hostname: 'localhost',
          port: 5001,
          path: '/api/clipboard',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        { text: 'QuickClip Integration Test Clipboard Text!' }
      );
      console.log('   Created Text Share Code:', textShare.data.data.code, 'ID:', textShare.data.data.shareId);

      // 3. Retrieve Text Share by Code
      console.log('3. Testing GET /api/clipboard/:code...');
      const retrievedText = await requestJson({
        hostname: 'localhost',
        port: 5001,
        path: `/api/clipboard/${textShare.data.data.code}`,
        method: 'GET',
      });
      console.log('   Retrieved Text Content:', retrievedText.data.data.text);

      // 4. File Upload Initiation
      console.log('4. Testing POST /api/uploads/initiate...');
      const sampleFileContent = 'Hello World! This is a test file for QuickClip streaming upload.';
      const sampleBuffer = Buffer.from(sampleFileContent, 'utf-8');

      const fileInit = await requestJson(
        {
          hostname: 'localhost',
          port: 5001,
          path: '/api/uploads/initiate',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        {
          filename: 'quickclip-test-document.txt',
          fileSize: sampleBuffer.length,
          mimeType: 'text/plain',
        }
      );
      console.log('   Upload Session Created. Code:', fileInit.data.data.code, 'Type:', fileInit.data.data.uploadSession.uploadType);

      // 5. Stream upload the file
      console.log('5. Streaming file body to:', fileInit.data.data.uploadSession.uploadUrl);
      const streamRes = await putStream(fileInit.data.data.uploadSession.uploadUrl, sampleBuffer, 'text/plain');
      console.log('   Stream upload HTTP status:', streamRes.status);

      // 6. Complete upload
      console.log('6. Completing upload...');
      const completeRes = await requestJson(
        {
          hostname: 'localhost',
          port: 5001,
          path: `/api/uploads/${fileInit.data.data.shareId}/complete`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        {}
      );
      console.log('   Upload Completed and Verified:', completeRes.data.data.filename, 'Size:', completeRes.data.data.size);

      // 7. Retrieve file metadata
      console.log('7. Retrieving share metadata by 6-digit code...');
      const metaRes = await requestJson({
        hostname: 'localhost',
        port: 5001,
        path: `/api/shares/${fileInit.data.data.code}`,
        method: 'GET',
      });
      console.log('   Metadata found. Filename:', metaRes.data.data.file.filename);

      // 8. Download file
      console.log('8. Downloading file...');
      const downloadedContent = await new Promise((resolve, reject) => {
        http.get(`http://localhost:5001/api/shares/${fileInit.data.data.code}/download`, (res) => {
          let chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        }).on('error', reject);
      });
      console.log('   Downloaded content matches:', downloadedContent === sampleFileContent);

      // 9. Authorized Deletion
      console.log('9. Deleting share using sender management token...');
      const deleteRes = await requestJson({
        hostname: 'localhost',
        port: 5001,
        path: `/api/shares/${fileInit.data.data.shareId}`,
        method: 'DELETE',
        headers: {
          'X-Management-Token': fileInit.data.data.managementToken,
        },
      });
      console.log('   Delete response:', deleteRes.data.message);

      console.log('\n--- ALL INTEGRATION VERIFICATION CHECKS PASSED SUCCESSFULLY ---');
    } catch (err) {
      console.error('Integration check failed:', err);
      process.exitCode = 1;
    } finally {
      server.close();
      await disconnectDB();
    }
  });
}

run();
