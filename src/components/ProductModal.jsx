"use client"

import { useState, useEffect } from "react"

const ProductModal = ({ show, onHide, product, onSave }) => {
  const [formData, setFormData] = useState({
    Name: "",
    Code: "",
    ImageURL: "",
    CostPrice: "",
    RetailPrice: "",
  })

  useEffect(() => {
    if (product) {
      setFormData({
        Name: product.Name || "",
        Code: product.Code || "",
        ImageURL: product.ImageURL || "",
        CostPrice: product.CostPrice || "",
        RetailPrice: product.RetailPrice || "",
      })
    } else {
      setFormData({
        Name: "",
        Code: "",
        ImageURL: "",
        CostPrice: "",
        RetailPrice: "",
      })
    }
  }, [product, show])

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

  const checkProductCodeExists = async (code) => {
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

      const products = await response.json()
      return products.some((p) => p.code.toLowerCase() === code.toLowerCase())
    } catch (error) {
      console.error("Error checking product code:", error)
      // If there's an error checking, allow the submission to proceed
      // The backend will handle duplicate validation
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation for new product - check if code already exists
    if (!product) {
      const codeExists = await checkProductCodeExists(formData.Code)
      if (codeExists) {
        window.Swal.fire({
          title: "Code Already Exists!",
          text: `Product code "${formData.Code}" already exists. Please use a different code.`,
          icon: "error",
          confirmButtonColor: "#8b5cf6",
        })
        return
      }
    }

    onSave(formData)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (!show) return null

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{product ? "Edit Product" : "Add New Product"}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="Name"
                  value={formData.Name}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Product Code *
                  {product && <small className="text-muted ms-2">(Code cannot be changed in edit mode)</small>}
                </label>
                <input
                  type="text"
                  className={`form-control ${product ? "bg-light" : ""}`}
                  name="Code"
                  value={formData.Code}
                  onChange={handleChange}
                  required
                  readOnly={!!product} // Make read-only in edit mode
                  disabled={!!product} // Disable in edit mode
                  style={product ? { cursor: "not-allowed" } : {}}
                />
                {product && (
                  <small className="text-info">
                    <i className="fas fa-lock me-1"></i>
                    Product code is locked for existing products
                  </small>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-control"
                  name="ImageURL"
                  value={formData.ImageURL}
                  onChange={handleChange}
                />
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Cost Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="CostPrice"
                      value={formData.CostPrice}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Retail Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="RetailPrice"
                      value={formData.RetailPrice}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {product ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>

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

export default ProductModal
