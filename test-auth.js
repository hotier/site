// 测试脚本
const handler = require('./api/auth.js').default;

// 模拟请求对象
const mockRequest = {
  url: '/api/auth',
  method: 'GET',
  headers: {
    host: 'localhost:3000'
  },
  searchParams: new URLSearchParams()
};

// 模拟环境变量
process.env.GITHUB_CLIENT_ID = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
process.env.ALLOWED_DOMAINS = 'localhost:3000';

// 测试处理函数
async function testHandler() {
  try {
    console.log('Testing handler...');
    const response = await handler(mockRequest);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    console.log('Test passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testHandler();
