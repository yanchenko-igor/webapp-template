const request = require('supertest');
const app = require('./index');

describe('Backend API Tests', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/messages', () => {
    it('should return messages array', async () => {
      const response = await request(app).get('/api/messages');
      expect(response.status).toBe(200);
      expect(response.body.messages).toBeDefined();
      expect(Array.isArray(response.body.messages)).toBe(true);
    });
  });

  describe('POST /api/messages', () => {
    it('should create a new message', async () => {
      const newMessage = {
        username: 'TestUser',
        text: 'Hello, World!'
      };

      const response = await request(app)
        .post('/api/messages')
        .send(newMessage);

      expect(response.status).toBe(201);
      expect(response.body.message).toBeDefined();
      expect(response.body.message.username).toBe('TestUser');
      expect(response.body.message.text).toBe('Hello, World!');
      expect(response.body.message.id).toBeDefined();
      expect(response.body.message.timestamp).toBeDefined();
    });

    it('should return 400 if username is missing', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({ text: 'Hello' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 if text is missing', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({ username: 'TestUser' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/stats', () => {
    it('should return statistics', async () => {
      const response = await request(app).get('/api/stats');
      expect(response.status).toBe(200);
      expect(response.body.totalMessages).toBeDefined();
      expect(response.body.connectedUsers).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });
});
