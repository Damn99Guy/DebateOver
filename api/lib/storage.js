import { promises as fs } from 'fs';
import path from 'path';

const ORDERS_KEY = 'debate-over-orders';
const filePath = path.join(process.cwd(), 'api', 'orders.json');

async function getKvStore() {
  const hasKvConfig = process.env.KV_URL || process.env.KV_REST_API_URL;
  if (!hasKvConfig) {
    return null;
  }

  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch (error) {
    console.warn('Vercel KV unavailable, falling back to local storage:', error.message);
    return null;
  }
}

export async function loadOrders() {
  const store = await getKvStore();

  if (store) {
    const value = await store.get(ORDERS_KEY);
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  }

  try {
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export async function saveOrders(orders) {
  const store = await getKvStore();

  if (store) {
    await store.set(ORDERS_KEY, orders);
    return;
  }

  await fs.writeFile(filePath, JSON.stringify(orders, null, 2), 'utf8');
}
