// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://localhost:7001/api"

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body)
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return await response.json()
    }

    return response
  } catch (error) {
    console.error("API Request Error:", error)
    throw error
  }
}

// Products API
export const productsApi = {
  // Get all products
  getAll: () => apiRequest("/products"),

  // Get product by ID
  getById: (id) => apiRequest(`/products/${id}`),

  // Create new product
  create: (productData) =>
    apiRequest("/products", {
      method: "POST",
      body: productData,
    }),

  // Update product
  update: (id, productData) =>
    apiRequest(`/products/${id}`, {
      method: "PUT",
      body: productData,
    }),

  // Delete product
  delete: (id) =>
    apiRequest(`/products/${id}`, {
      method: "DELETE",
    }),

  // Search products
  search: (searchTerm) => apiRequest(`/products/search?q=${encodeURIComponent(searchTerm)}`),
}

// Salespersons API
export const salespersonsApi = {
  // Get all salespersons
  getAll: () => apiRequest("/salespersons"),

  // Get salesperson by ID
  getById: (id) => apiRequest(`/salespersons/${id}`),

  // Create new salesperson
  create: (salespersonData) =>
    apiRequest("/salespersons", {
      method: "POST",
      body: salespersonData,
    }),

  // Update salesperson
  update: (id, salespersonData) =>
    apiRequest(`/salespersons/${id}`, {
      method: "PUT",
      body: salespersonData,
    }),

  // Delete salesperson
  delete: (id) =>
    apiRequest(`/salespersons/${id}`, {
      method: "DELETE",
    }),
}

// Sales API
export const salesApi = {
  // Get all sales
  getAll: () => apiRequest("/sales"),

  // Get sale by ID
  getById: (id) => apiRequest(`/sales/${id}`),

  // Create new sale
  create: (saleData) =>
    apiRequest("/sales", {
      method: "POST",
      body: saleData,
    }),

  // Update sale
  update: (id, saleData) =>
    apiRequest(`/sales/${id}`, {
      method: "PUT",
      body: saleData,
    }),

  // Delete sale
  delete: (id) =>
    apiRequest(`/sales/${id}`, {
      method: "DELETE",
    }),

  // Get sales by date range
  getByDateRange: (startDate, endDate) => apiRequest(`/sales/daterange?start=${startDate}&end=${endDate}`),

  // Get sales by salesperson
  getBySalesperson: (salespersonId) => apiRequest(`/sales/salesperson/${salespersonId}`),
}

// Error handling utility
export const handleApiError = (error) => {
  console.error("API Error:", error)

  if (error.message.includes("Failed to fetch")) {
    return "Unable to connect to server. Please check your internet connection."
  }

  if (error.message.includes("404")) {
    return "The requested resource was not found."
  }

  if (error.message.includes("500")) {
    return "Internal server error. Please try again later."
  }

  return error.message || "An unexpected error occurred."
}
