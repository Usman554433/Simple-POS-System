"use client"

import { useState, useEffect } from "react"
import ProductModal from "./ProductModal"
import DataTable from "./DataTable"
import Swal from "sweetalert2"

const ProductsComponent = () => {
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  const API_BASE_URL = "https://localhost:7078/api/products"

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch(API_BASE_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Transform backend data to match frontend format
      const transformedProducts = data.map((product) => ({
        ProductId: product.productId,
        Name: product.name,
        Code: product.code,
        CostPrice: product.costPrice,
        RetailPrice: product.retailPrice,
        ImageURL: product.imageURL,
        CreationDate: product.creationDate,
        UpdatedDate: product.updationDate,
      }))

      setProducts(transformedProducts)
    } catch (error) {
      console.error("Error loading products:", error)
      Swal.fire({
        title: "Error!",
        text: `Failed to load products: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleDeleteProduct = async (productId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Id: productId,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Remove product from local state
        setProducts(products.filter((p) => p.ProductId !== productId))

        Swal.fire({
          title: "Deleted!",
          text: "Product has been deleted.",
          icon: "success",
          confirmButtonColor: "#8b5cf6",
        })
      } catch (error) {
        console.error("Error deleting product:", error)
        Swal.fire({
          title: "Error!",
          text: `Failed to delete product: ${error.message}`,
          icon: "error",
          confirmButtonColor: "#8b5cf6",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSaveProduct = async (productData) => {
    setLoading(true)

    try {
      if (editingProduct) {
        // Check if any changes were made
        const hasChanges =
          editingProduct.Name !== productData.Name ||
          editingProduct.ImageURL !== productData.ImageURL ||
          Number.parseFloat(editingProduct.CostPrice) !== Number.parseFloat(productData.CostPrice) ||
          Number.parseFloat(editingProduct.RetailPrice) !== Number.parseFloat(productData.RetailPrice)

        if (!hasChanges) {
          setLoading(false)
          setShowModal(false)
          Swal.fire({
            title: "No Changes Made!",
            text: "No changes were detected. The product remains unchanged.",
            icon: "info",
            confirmButtonColor: "#8b5cf6",
          })
          return
        }

        // Update existing product
        const updateData = {
          ProductId: editingProduct.ProductId,
          Name: productData.Name,
          ImageURL: productData.ImageURL,
          CostPrice: Number.parseFloat(productData.CostPrice),
          RetailPrice: Number.parseFloat(productData.RetailPrice),
        }

        const response = await fetch(`${API_BASE_URL}/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Update product in local state
        setProducts(
          products.map((p) =>
            p.ProductId === editingProduct.ProductId
              ? {
                  ...p,
                  ...productData,
                  CostPrice: Number.parseFloat(productData.CostPrice),
                  RetailPrice: Number.parseFloat(productData.RetailPrice),
                  UpdatedDate: new Date().toISOString(),
                }
              : p,
          ),
        )

        Swal.fire({
          title: "Success!",
          text: "Product updated successfully",
          icon: "success",
          confirmButtonColor: "#8b5cf6",
        })
      } else {
        // Add new product - First update the UI immediately, then call API
        const tempId = Date.now() // Temporary ID for immediate UI update
        const newProduct = {
          ProductId: tempId,
          Name: productData.Name,
          Code: productData.Code,
          CostPrice: Number.parseFloat(productData.CostPrice),
          RetailPrice: Number.parseFloat(productData.RetailPrice),
          ImageURL: productData.ImageURL,
          CreationDate: new Date().toISOString(),
          UpdatedDate: null,
        }

        // Add to state immediately for smooth UI
        setProducts([newProduct, ...products])

        // Now call the API
        const addData = {
          Name: productData.Name,
          Code: productData.Code,
          ImageURL: productData.ImageURL,
          CostPrice: Number.parseFloat(productData.CostPrice),
          RetailPrice: Number.parseFloat(productData.RetailPrice),
        }

        const response = await fetch(`${API_BASE_URL}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(addData),
        })

        if (!response.ok) {
          // If API fails, remove the temporary product from state
          setProducts(products.filter((p) => p.ProductId !== tempId))
          const errorText = await response.text()
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
        }

        // Get the real ID from server response
        const responseData = await response.json()

        // Update the temporary product with real server ID
        setProducts((prevProducts) =>
          prevProducts.map((p) => (p.ProductId === tempId ? { ...p, ProductId: responseData.productId || tempId } : p)),
        )

        Swal.fire({
          title: "Success!",
          text: "Product added successfully",
          icon: "success",
          confirmButtonColor: "#8b5cf6",
        })
      }
    } catch (error) {
      console.error("Error saving product:", error)
      Swal.fire({
        title: "Error!",
        text: `Failed to save product: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
    } finally {
      setLoading(false)
    }

    setShowModal(false)
  }

  const filteredProducts = products.filter(
    (product) =>
      product.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.Code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns = [
    { key: "Name", label: "Product Name" },
    { key: "Code", label: "Code" },
    { key: "CostPrice", label: "Cost Price", render: (value) => `$${value}` },
    { key: "RetailPrice", label: "Retail Price", render: (value) => `$${value}` },
    {
      key: "CreationDate",
      label: "Created At",
      render: (value) =>
        new Date(value).toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
    },
    {
      key: "UpdatedDate",
      label: "Updated At",
      render: (value) =>
        value
          ? new Date(value).toLocaleString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })
          : "-",
    },
  ]

  return (
    <div className="full-page-layout">
      {/* Loading Overlay */}
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
        >
          <div className="text-center text-white">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div>Loading products...</div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="page-header">
        <div className="header-left">
          <div className="page-title">
            <i className="fas fa-box"></i>
            <h1>Products Management</h1>
          </div>
          <p className="page-subtitle">Manage your product inventory and pricing</p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary btn-lg" onClick={handleAddProduct} disabled={loading}>
            <i className="fas fa-plus me-2"></i>
            Add New Product
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="controls-left">
          <div className="search-wrapper">
            <i className="fas fa-search"></i>
            <input
              type="text"
              className="form-control search-input"
              placeholder="Search products by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="controls-right">
          <div className="stats-display">
            <span className="stats-number">{filteredProducts.length}</span>
            <span className="stats-label">{filteredProducts.length === 1 ? "Product" : "Products"}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="page-content">
        <DataTable
          data={filteredProducts}
          columns={columns}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          defaultSortConfig={{ key: "CreationDate", direction: "desc" }}
        />
      </div>

      {/* Footer Stats */}
      {products.length > 0 && (
        <div className="page-footer">
          <div className="footer-stats">
            <div className="stat-item">
              <div className="stat-value">{products.length}</div>
              <div className="stat-label">Total Products</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                ${products.reduce((sum, p) => sum + Number.parseFloat(p.RetailPrice || 0), 0).toFixed(0)}
              </div>
              <div className="stat-label">Total Retail Value</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                ${products.reduce((sum, p) => sum + Number.parseFloat(p.CostPrice || 0), 0).toFixed(0)}
              </div>
              <div className="stat-label">Total Cost Value</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {products.length > 0
                  ? (
                      ((products.reduce((sum, p) => sum + Number.parseFloat(p.RetailPrice || 0), 0) -
                        products.reduce((sum, p) => sum + Number.parseFloat(p.CostPrice || 0), 0)) /
                        products.reduce((sum, p) => sum + Number.parseFloat(p.CostPrice || 0), 0)) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <div className="stat-label">Avg. Margin</div>
            </div>
          </div>
        </div>
      )}

      <ProductModal
        show={showModal}
        onHide={() => setShowModal(false)}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  )
}

export default ProductsComponent
