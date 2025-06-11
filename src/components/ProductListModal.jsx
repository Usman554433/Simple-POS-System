"use client"

import { useState, useEffect } from "react"

const ProductListModal = ({ show, onHide, onSelectProduct }) => {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  useEffect(() => {
    if (show) {
      loadProducts()
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

  const loadProducts = () => {
    const saved = localStorage.getItem("products")
    if (saved) {
      setProducts(JSON.parse(saved))
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
    onHide()
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
              Select Product
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>
          <div className="modal-body">
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
              </div>
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
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((product) => (
                      <tr
                        key={product.ProductId}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
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
                        </td>
                        <td>
                          <span className="badge bg-secondary">{product.Code}</span>
                        </td>
                        <td>${product.CostPrice}</td>
                        <td>
                          <strong className="text-primary">${product.RetailPrice}</strong>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleProductSelect(product)}
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
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              <i className="fas fa-times me-2"></i>
              Close
            </button>
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
