// API Configuration
const IS_PRODUCTION = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true';

const API_URL = IS_PRODUCTION 
  ? 'https://web-production-6a494.up.railway.app'
  : 'http://localhost:8000';

export default API_URL; 