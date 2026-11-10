import axios from 'axios';
import type { OCRResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45 detik untuk mengantisipasi OCR dan cold start
});

export async function checkBackendHealth(): Promise<{ status: string; tesseract: string }> {
  const response = await client.get('/health', { timeout: 12000 });
  return response.data;
}

export async function parseReceiptApi(file: File): Promise<OCRResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await client.post<OCRResponse>('/api/v1/ocr/parse', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

