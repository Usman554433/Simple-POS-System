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

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = () => {
    const savedProducts = localStorage.getItem("products")
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts))
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

  const handleDeleteProduct = (productId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        // More efficient: Just remove the specific product
        const savedProducts = JSON.parse(localStorage.getItem("products") || "[]")
        const index = savedProducts.findIndex((p) => p.ProductId === productId)

        if (index > -1) {
          savedProducts.splice(index, 1) // Remove just this one product
          localStorage.setItem("products", JSON.stringify(savedProducts))
          setProducts(savedProducts) // Update state
        }

        Swal.fire({
          title: "Deleted!",
          text: "Product has been deleted.",
          icon: "success",
          confirmButtonColor: "#8b5cf6",
        })
      }
    })
  }

  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      // Check if any data has actually changed
      const hasChanges =
        editingProduct.Name !== productData.Name ||
        editingProduct.ImageURL !== productData.ImageURL ||
        editingProduct.CostPrice !== productData.CostPrice ||
        editingProduct.RetailPrice !== productData.RetailPrice
      // Note: Code is not checked since it's locked in edit mode

      if (!hasChanges) {
        Swal.fire({
          title: "No Changes!",
          text: "No changes were made to the product",
          icon: "info",
          confirmButtonColor: "#8b5cf6",
        })
        setShowModal(false)
        return
      }

      // More efficient: Just update the specific product
      const savedProducts = JSON.parse(localStorage.getItem("products") || "[]")
      const index = savedProducts.findIndex((p) => p.ProductId === editingProduct.ProductId)

      if (index > -1) {
        savedProducts[index] = {
          ...productData,
          ProductId: editingProduct.ProductId,
          Code: editingProduct.Code, // Keep the original code (locked)
          CreationDate: editingProduct.CreationDate,
          UpdatedDate: new Date().toISOString(),
        }
        localStorage.setItem("products", JSON.stringify(savedProducts))
        setProducts(savedProducts) // Update state
      }

      Swal.fire({
        title: "Success!",
        text: "Product updated successfully",
        icon: "success",
        confirmButtonColor: "#8b5cf6",
      })
    } else {
      // More efficient: Just add the new product
      const savedProducts = JSON.parse(localStorage.getItem("products") || "[]")
      const now = new Date().toISOString()
      const newProduct = {
        ...productData,
        ProductId: Date.now(),
        CreationDate: now,
        UpdatedDate: null,
      }

      savedProducts.push(newProduct) // Just add this one product
      localStorage.setItem("products", JSON.stringify(savedProducts))
      setProducts(savedProducts) // Update state

      Swal.fire({
        title: "Success!",
        text: "Product added successfully",
        icon: "success",
        confirmButtonColor: "#8b5cf6",
      })
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
          <button className="btn btn-primary btn-lg" onClick={handleAddProduct}>
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
