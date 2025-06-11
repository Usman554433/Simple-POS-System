"use client"

import { useState, useEffect, useRef } from "react"
import ProductListModal from "./ProductListModal"
import Swal from "sweetalert2"

const SaleTab = ({ onSaveSale, loadedSaleData, editingSaleId, onClearEditing, onDeleteSale }) => {
  const [saleDate, setSaleDate] = useState("")
  const [selectedSalesperson, setSelectedSalesperson] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [saleItems, setSaleItems] = useState([])
  const [salespersons, setSalespersons] = useState([])
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [comments, setComments] = useState("")
  const [showProductListModal, setShowProductListModal] = useState(false)
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1)

  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    // Set current date and time
    const now = new Date()
    const formattedDate = now.toISOString().slice(0, 16)
    setSaleDate(formattedDate)

    // Load data from localStorage
    loadSalespersons()
    loadProducts()
  }, [])

  useEffect(() => {
    if (loadedSaleData) {
      // For editing, use the creation date if available, otherwise use SaleDate
      const dateToUse = loadedSaleData.CreationDate || loadedSaleData.SaleDate
      setSaleDate(dateToUse.slice(0, 16)) // Format for datetime-local input
      setSelectedSalesperson(loadedSaleData.SalespersonId)
      setSaleItems(loadedSaleData.SaleItems || [])
      setComments(loadedSaleData.Comments || "")
    }
  }, [loadedSaleData])

  useEffect(() => {
    if (productSearch.length > 0) {
      const filtered = products.filter(
        (product) =>
          product.Name.toLowerCase().includes(productSearch.toLowerCase()) ||
          product.Code.toLowerCase().includes(productSearch.toLowerCase()),
      )
      setFilteredProducts(filtered)
      setSelectedProductIndex(filtered.length > 0 ? 0 : -1) // Select first item by default
    } else {
      setFilteredProducts([])
      setSelectedProductIndex(-1)
    }
  }, [productSearch, products])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (filteredProducts.length === 0) return

    // Arrow down
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedProductIndex((prevIndex) => (prevIndex < filteredProducts.length - 1 ? prevIndex + 1 : prevIndex))

      // Scroll into view if needed
      if (dropdownRef.current && selectedProductIndex >= 0) {
        const items = dropdownRef.current.querySelectorAll(".dropdown-item")
        if (items[selectedProductIndex + 1]) {
          items[selectedProductIndex + 1].scrollIntoView({ block: "nearest" })
        }
      }
    }

    // Arrow up
    else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedProductIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0))

      // Scroll into view if needed
      if (dropdownRef.current && selectedProductIndex > 0) {
        const items = dropdownRef.current.querySelectorAll(".dropdown-item")
        if (items[selectedProductIndex - 1]) {
          items[selectedProductIndex - 1].scrollIntoView({ block: "nearest" })
        }
      }
    }

    // Enter key
    else if (e.key === "Enter" && selectedProductIndex >= 0) {
      e.preventDefault()
      addProductToSale(filteredProducts[selectedProductIndex])
    }
  }

  const loadSalespersons = () => {
    const saved = localStorage.getItem("salespersons")
    if (saved) {
      setSalespersons(JSON.parse(saved))
    }
  }

  const loadProducts = () => {
    const saved = localStorage.getItem("products")
    if (saved) {
      setProducts(JSON.parse(saved))
    }
  }

  const addProductToSale = (product) => {
    const existingItem = saleItems.find((item) => item.ProductId === product.ProductId)

    if (existingItem) {
      setSaleItems(
        saleItems.map((item) =>
          item.ProductId === product.ProductId ? { ...item, Quantity: item.Quantity + 1 } : item,
        ),
      )
    } else {
      const newItem = {
        ProductId: product.ProductId,
        Name: product.Name,
        Code: product.Code,
        RetailPrice: Number.parseFloat(product.RetailPrice),
        Quantity: 1,
        Discount: 0,
      }
      setSaleItems([...saleItems, newItem])
    }

    setProductSearch("")
    setFilteredProducts([])
    setSelectedProductIndex(-1)
  }

  const updateSaleItem = (productId, field, value) => {
    let processedValue = Number.parseFloat(value) || 0

    // Validation logic
    if (field === "Quantity") {
      // Quantity must be at least 1 and cannot be negative
      if (processedValue < 1) {
        processedValue = 1
        Swal.fire({
          title: "Invalid Quantity!",
          text: "Quantity must be at least 1",
          icon: "warning",
          confirmButtonColor: "#8b5cf6",
          timer: 2000,
          showConfirmButton: false,
        })
      }
      // Round to nearest integer for quantity
      processedValue = Math.round(processedValue)
    } else if (field === "Discount") {
      // Discount cannot be negative or more than 100%
      if (processedValue < 0) {
        processedValue = 0
        Swal.fire({
          title: "Invalid Discount!",
          text: "Discount cannot be negative",
          icon: "warning",
          confirmButtonColor: "#8b5cf6",
          timer: 2000,
          showConfirmButton: false,
        })
      } else if (processedValue > 100) {
        processedValue = 100
        Swal.fire({
          title: "Invalid Discount!",
          text: "Discount cannot exceed 100%",
          icon: "warning",
          confirmButtonColor: "#8b5cf6",
          timer: 2000,
          showConfirmButton: false,
        })
      }
      // Round to 2 decimal places for discount
      processedValue = Math.round(processedValue * 100) / 100
    }

    setSaleItems(saleItems.map((item) => (item.ProductId === productId ? { ...item, [field]: processedValue } : item)))
  }

  const removeSaleItem = (productId) => {
    setSaleItems(saleItems.filter((item) => item.ProductId !== productId))
  }

  const calculateAmount = (item) => {
    // Ensure all values are positive numbers
    const price = Math.max(0, Number.parseFloat(item.RetailPrice) || 0)
    const quantity = Math.max(1, Math.round(Number.parseFloat(item.Quantity) || 1))
    const discount = Math.max(0, Math.min(100, Number.parseFloat(item.Discount) || 0))

    const subtotal = price * quantity
    const discountAmount = (subtotal * discount) / 100
    const finalAmount = subtotal - discountAmount

    // Ensure final amount is never negative
    return Math.max(0, finalAmount)
  }

  const calculateTotal = () => {
    const total = saleItems.reduce((sum, item) => sum + calculateAmount(item), 0)
    // Ensure total is never negative
    return Math.max(0, total)
  }

  const validateSaleItems = () => {
    let hasErrors = false
    const errors = []

    saleItems.forEach((item, index) => {
      // Check for invalid quantities
      if (!item.Quantity || item.Quantity < 1) {
        hasErrors = true
        errors.push(`Row ${index + 1}: Quantity must be at least 1`)
      }

      // Check for invalid discounts
      if (item.Discount < 0 || item.Discount > 100) {
        hasErrors = true
        errors.push(`Row ${index + 1}: Discount must be between 0% and 100%`)
      }

      // Check for invalid prices
      if (!item.RetailPrice || item.RetailPrice <= 0) {
        hasErrors = true
        errors.push(`Row ${index + 1}: Invalid retail price`)
      }

      // Check if amount becomes negative
      if (calculateAmount(item) <= 0) {
        hasErrors = true
        errors.push(`Row ${index + 1}: Item amount cannot be zero or negative`)
      }
    })

    if (hasErrors) {
      Swal.fire({
        title: "Validation Errors!",
        html: errors.join("<br>"),
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
      return false
    }

    return true
  }

  const clearForm = () => {
    setSaleItems([])
    setComments("")
    setSelectedSalesperson("")

    // Reset date to current time
    const now = new Date()
    const formattedDate = now.toISOString().slice(0, 16)
    setSaleDate(formattedDate)

    // Clear editing state
    onClearEditing()
  }

  const handleSaveRecord = () => {
    // if (!selectedSalesperson) {
    //   Swal.fire({
    //     title: "Error!",
    //     text: "Please select a salesperson",
    //     icon: "error",
    //     confirmButtonColor: "#8b5cf6",
    //   })
    //   return
    // }

    if (saleItems.length === 0) {
      Swal.fire({
        title: "Error!",
        text: "Please add at least one product",
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
      return
    }

    // Validate all sale items
    if (!validateSaleItems()) {
      return
    }

    const totalAmount = calculateTotal()

    // Final check for total amount
    if (totalAmount <= 0) {
      Swal.fire({
        title: "Error!",
        text: "Total sale amount must be greater than zero",
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
      return
    }

    const saleData = {
      Total: totalAmount,
      SalespersonId: selectedSalesperson,
      Comments: comments,
      SaleItems: saleItems,
    }

    // Pass editing information to parent
    onSaveSale(saleData, !!editingSaleId, editingSaleId)

    // Clear form after save
    clearForm()
  }

  const handleClearForm = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "All unsaved changes will be lost.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, clear it!",
    }).then((result) => {
      if (result.isConfirmed) {
        clearForm()
      }
    })
  }

  const handleDeleteSale = () => {
    if (editingSaleId) {
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
          onDeleteSale(editingSaleId)
          // Clear form after deletion
          clearForm()
        }
      })
    }
  }

  return (
    <div className="w-100">
      {editingSaleId && (
        <div className="alert alert-warning d-flex justify-content-between align-items-center mb-4">
          <div>
            <i className="fas fa-edit me-2"></i>
            <strong>Editing Mode:</strong> You are currently editing Sale ID: {editingSaleId}
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={handleClearForm}>
            <i className="fas fa-times me-1"></i>
            Cancel Edit
          </button>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label">Date</label>
          <input
            type="datetime-local"
            className="form-control"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Salesperson</label>
          <select
            className="form-select"
            value={selectedSalesperson}
            onChange={(e) => setSelectedSalesperson(e.target.value)}
          >
            <option value="">--Select Sale Person--</option>
            {salespersons.map((person) => (
              <option key={person.SalespersonID} value={person.SalespersonID}>
                {person.Name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-12">
          <label className="form-label">Enter Product...</label>
          <div className="d-flex gap-3 align-items-end">
            <div className="flex-grow-1" style={{ maxWidth: "400px" }}>
              <div className="position-relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-control"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {filteredProducts.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="position-absolute w-100 bg-white border rounded shadow-sm"
                    style={{ zIndex: 1000, top: "100%", maxHeight: "300px", overflowY: "auto" }}
                  >
                    {filteredProducts.map((product, index) => (
                      <div
                        key={product.ProductId}
                        className={`p-2 border-bottom dropdown-item ${selectedProductIndex === index ? "bg-light" : ""}`}
                        onClick={() => addProductToSale(product)}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setSelectedProductIndex(index)}
                      >
                        <strong>{product.Name}</strong> - {product.Code} (${product.RetailPrice})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <button
                type="button"
                className="btn btn-outline-primary d-flex align-items-center justify-content-center"
                onClick={() => setShowProductListModal(true)}
                style={{ width: "50px", height: "38px" }}
                title="Browse All Products"
              >
                <i className="fas fa-shopping-cart"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <div className="d-flex align-items-center">
            <label className="me-2">Show</label>
            <select className="form-select w-auto">
              <option value="10">10</option>
            </select>
            <span className="ms-2">entries</span>
          </div>
        </div>
        <div className="col-md-6">
          <input type="text" className="form-control" placeholder="Search..." />
        </div>
      </div>

      <div className="table-responsive mb-4">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Quantity</th>
              <th>Discount (%)</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {saleItems.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  No products added
                </td>
              </tr>
            ) : (
              saleItems.map((item) => (
                <tr key={item.ProductId}>
                  <td>{item.Name}</td>
                  <td>{item.Code}</td>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      style={{ width: "80px" }}
                      value={item.Quantity}
                      onChange={(e) => updateSaleItem(item.ProductId, "Quantity", e.target.value)}
                      min="1"
                      step="1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      style={{ width: "80px" }}
                      value={item.Discount}
                      onChange={(e) => updateSaleItem(item.ProductId, "Discount", e.target.value)}
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </td>
                  <td>${item.RetailPrice.toFixed(2)}</td>
                  <td>
                    <span className={calculateAmount(item) <= 0 ? "text-danger fw-bold" : "text-success fw-bold"}>
                      ${calculateAmount(item).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeSaleItem(item.ProductId)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="row mb-4">
        <div className="col-md-8">
          <p>
            Showing 1 to {saleItems.length} of {saleItems.length} entries
          </p>
        </div>
        <div className="col-md-4 text-end">
          <h5>
            Net Total:{" "}
            <span className={calculateTotal() <= 0 ? "text-danger" : "text-primary"}>
              ${calculateTotal().toFixed(2)}
            </span>
          </h5>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-12">
          <label className="form-label">Comments</label>
          <textarea
            className="form-control"
            rows="3"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Enter any comments..."
          />
        </div>
      </div>

      <div className="text-center">
        <button className="btn btn-primary btn-lg" onClick={handleSaveRecord}>
          <i className={`fas ${editingSaleId ? "fa-save" : "fa-plus"} me-2`}></i>
          {editingSaleId ? "Update Record" : "Save Record"}
        </button>
        {editingSaleId && (
          <>
            <button className="btn btn-secondary btn-lg ms-3" onClick={handleClearForm}>
              <i className="fas fa-times me-2"></i>
              Cancel Edit
            </button>
            <button className="btn btn-danger btn-lg ms-3" onClick={handleDeleteSale}>
              <i className="fas fa-trash me-2"></i>
              Delete Record
            </button>
          </>
        )}
      </div>

      <ProductListModal
        show={showProductListModal}
        onHide={() => setShowProductListModal(false)}
        onSelectProduct={addProductToSale}
      />
    </div>
  )
}

export default SaleTab
