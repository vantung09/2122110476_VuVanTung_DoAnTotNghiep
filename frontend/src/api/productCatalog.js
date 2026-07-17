import axiosClient from "./axiosClient";

const STATIC_PRODUCTS_URL = `${import.meta.env.BASE_URL}data/products.json`;

function normalizeProducts(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.products)) {
    return data.products;
  }
  return [];
}

async function loadStaticProducts() {
  const response = await fetch(STATIC_PRODUCTS_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Static catalog failed with ${response.status}`);
  }

  const products = normalizeProducts(await response.json());
  if (!products.length) {
    throw new Error("Static catalog is empty");
  }
  return products;
}

export async function loadProducts() {
  try {
    const response = await axiosClient.get("/products");
    const products = normalizeProducts(response.data);
    if (products.length) {
      return products;
    }
    throw new Error("Product API returned an empty catalog");
  } catch {
    return loadStaticProducts();
  }
}

export async function loadProductById(id) {
  try {
    const response = await axiosClient.get(`/products/${id}`);
    if (response.data && typeof response.data === "object" && response.data.id) {
      return response.data;
    }
    throw new Error("Product API returned an invalid product");
  } catch {
    const products = await loadStaticProducts();
    const product = products.find((item) => Number(item.id) === Number(id));
    if (!product) {
      throw new Error(`Product ${id} not found in static catalog`);
    }
    return product;
  }
}
