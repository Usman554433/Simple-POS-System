"use client"

import { useState, useEffect } from "react"

const ProductListModal = ({ show, onHide, onSelectProduct }) => {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [isLoading, setIsLoading] = useState(false)
  const [addedProducts, setAddedProducts] = useState(new Set()) // Track added products for visual feedback

  useEffect(() => {
    if (show) {
      loadProducts()
      setAddedProducts(new Set()) // Reset added products when modal opens
    }
  }, [show])

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && show) {
        onHide()
      }
    }

    if (show) {
      document.addEventListener("keydown", handleKeyDown)
      // Focus the modal when it opens
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [show, onHide])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("https://localhost:7078/api/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Transform backend data to match frontend format and sort by latest first
      const transformedProducts = data
        .map((product) => ({
          ProductId: product.productId,
          Name: product.name,
          Code: product.code,
          CostPrice: product.costPrice,
          RetailPrice: product.retailPrice,
          ImageURL: product.imageURL,
          CreationDate: product.creationDate,
          UpdatedDate: product.updationDate,
        }))
        .sort((a, b) => new Date(b.CreationDate) - new Date(a.CreationDate)) // Latest first

      setProducts(transformedProducts)
    } catch (error) {
      console.error("Error loading products:", error)
      // Keep products as empty array if there's an error
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.Code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleProductSelect = (product) => {
    onSelectProduct(product)
    // Add to the set of added products for visual feedback
    setAddedProducts((prev) => new Set([...prev, product.ProductId]))

    // Show brief success feedback
    const button = document.querySelector(`[data-product-id="${product.ProductId}"]`)
    if (button) {
      const originalText = button.innerHTML
      button.innerHTML = '<i class="fas fa-check me-1"></i>Added!'
      button.classList.remove("btn-primary")
      button.classList.add("btn-success")

      setTimeout(() => {
        button.innerHTML = originalText
        button.classList.remove("btn-success")
        button.classList.add("btn-primary")
      }, 1000)
    }

    // DON'T close the modal - keep it open for multiple selections
    // onHide() - REMOVED
  }

  const handleRowClick = (product, event) => {
    // Prevent row click when clicking on the Add button
    if (event.target.closest(".btn")) {
      return
    }
    handleProductSelect(product)
  }

  const renderPagination = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? "active" : ""}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>,
      )
    }
    return pages
  }

  if (!show) return null

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-list me-2"></i>
              Select Product (Latest First)
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted">Loading latest products...</p>
              </div>
            ) : (
              <>
                <div className="row mb-3">
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search products by name or code..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1)
                      }}
                      autoFocus
                    />
                  </div>
                  <div className="col-md-4 text-end">
                    <span className="badge bg-primary fs-6">Total: {filteredProducts.length}</span>
                    <button
                      className="btn btn-sm btn-outline-secondary ms-2"
                      onClick={loadProducts}
                      title="Refresh Products"
                    >
                      <i className="fas fa-sync-alt"></i>
                    </button>
                  </div>
                </div>

                {/* Instructions for user */}
                <div className="alert alert-info py-2 mb-3">
                  <small>
                    <i className="fas fa-info-circle me-1"></i>
                    <strong>Tip:</strong> Click anywhere on a product row to add it to your sale. Modal stays open for
                    multiple selections.
                  </small>
                </div>

                {currentProducts.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <p className="text-muted">
                      {products.length === 0
                        ? "No products available. Please add products first."
                        : "No products match your search."}
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Product Name</th>
                          <th>Code</th>
                          <th>Cost Price</th>
                          <th>Retail Price</th>
                          <th>Added Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProducts.map((product) => (
                          <tr
                            key={product.ProductId}
                            style={{ cursor: "pointer" }}
                            className={`${addedProducts.has(product.ProductId) ? "table-success" : ""}`}
                            onClick={(e) => handleRowClick(product, e)}
                            onMouseEnter={(e) => {
                              if (!addedProducts.has(product.ProductId)) {
                                e.currentTarget.style.backgroundColor = "#f8f9fa"
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!addedProducts.has(product.ProductId)) {
                                e.currentTarget.style.backgroundColor = ""
                              }
                            }}
                            title="Click anywhere on this row to add product"
                          >
                            <td>
                              {product.ImageURL ? (
                                <img
                                  src={product.ImageURL || "/placeholder.svg"}
                                  alt={product.Name}
                                  style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                  className="rounded"
                                  onError={(e) => {
                                    e.target.style.display = "none"
                                    e.target.nextSibling.style.display = "flex"
                                  }}
                                />
                              ) : (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light rounded"
                                  style={{ width: "40px", height: "40px" }}
                                >
                                  <i className="fas fa-image text-muted"></i>
                                </div>
                              )}
                              <div
                                className="d-none align-items-center justify-content-center bg-light rounded"
                                style={{ width: "40px", height: "40px" }}
                              >
                                <i className="fas fa-image text-muted"></i>
                              </div>
                            </td>
                            <td>
                              <strong>{product.Name}</strong>
                              {addedProducts.has(product.ProductId) && (
                                <span className="badge bg-success ms-2 small">Added</span>
                              )}
                            </td>
                            <td>
                              <span className="badge bg-secondary">{product.Code}</span>
                            </td>
                            <td>${product.CostPrice}</td>
                            <td>
                              <strong className="text-primary">${product.RetailPrice}</strong>
                            </td>
                            <td>
                              <small className="text-muted">
                                {new Date(product.CreationDate).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation() // Prevent row click
                                  handleProductSelect(product)
                                }}
                                data-product-id={product.ProductId}
                                title="Add to Sale"
                              >
                                <i className="fas fa-plus me-1"></i>
                                Add
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="row mt-3">
                    <div className="col-md-6">
                      <p className="text-muted">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of{" "}
                        {filteredProducts.length} products
                      </p>
                    </div>
                    <div className="col-md-6">
                      <nav>
                        <ul className="pagination justify-content-end">
                          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                          </li>
                          {renderPagination()}
                          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="modal-footer">
            <div className="d-flex justify-content-between align-items-center w-100">
              <small className="text-muted">
                <i className="fas fa-mouse-pointer me-1"></i>
                Click any row to add • Modal stays open for multiple selections
              </small>
              <button type="button" className="btn btn-secondary" onClick={onHide}>
                <i className="fas fa-times me-2"></i>
                Close
              </button>
            </div>
          </div>

          {/* ESC key hint */}
          <div className="position-absolute" style={{ bottom: "10px", left: "20px" }}>
            <small className="text-muted">
              <i className="fas fa-keyboard me-1"></i>
              Press ESC to close
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductListModal
