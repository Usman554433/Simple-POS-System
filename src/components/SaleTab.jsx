"use client"

import { useState, useEffect, useRef } from "react"
import ProductListModal from "./ProductListModal"
import Swal from "sweetalert2"

// Live clock component for Pakistan time with seconds
const LiveDateTime = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format time in Pakistan timezone (UTC+5) for display
  const pakistanTime = new Date(time.getTime() + 5 * 60 * 60 * 1000)

  // Format for display: MM/DD/YYYY HH:MM:SS AM/PM
  const month = (pakistanTime.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = pakistanTime.getUTCDate().toString().padStart(2, "0")
  const year = pakistanTime.getUTCFullYear()
  const hours = pakistanTime.getUTCHours()
  const minutes = pakistanTime.getUTCMinutes().toString().padStart(2, "0")
  const seconds = pakistanTime.getUTCSeconds().toString().padStart(2, "0")
  const ampm = hours >= 12 ? "PM" : "AM"
  const displayHours = (hours % 12 || 12).toString().padStart(2, "0")

  return `${month}/${day}/${year} ${displayHours}:${minutes}:${seconds} ${ampm}`
}

// Static DateTime component for editing mode (shows creation or updated time)
const StaticDateTime = ({ dateTime }) => {
  if (!dateTime) return ""

  const date = new Date(dateTime)

  // Format for display: MM/DD/YYYY HH:MM:SS AM/PM
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const year = date.getFullYear()
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const seconds = date.getSeconds().toString().padStart(2, "0")
  const ampm = hours >= 12 ? "PM" : "AM"
  const displayHours = (hours % 12 || 12).toString().padStart(2, "0")

  return `${month}/${day}/${year} ${displayHours}:${minutes}:${seconds} ${ampm}`
}

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
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isLoadingSalespersons, setIsLoadingSalespersons] = useState(false)

  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    // Load salespersons on component mount
    loadSalespersons()
  }, [])

  // Load products when user starts searching (fresh data every time)
  useEffect(() => {
    if (productSearch.length > 0 && products.length === 0) {
      loadProducts()
    }
  }, [productSearch])

  // Update date automatically when NOT in editing mode
  useEffect(() => {
    if (!editingSaleId) {
      const timer = setInterval(() => {
        const now = new Date()
        // Convert to Pakistan time (UTC+5)
        const pakistanTime = new Date(now.getTime() + 5 * 60 * 60 * 1000)
        const formattedDate = pakistanTime.toISOString().slice(0, 16)
        setSaleDate(formattedDate)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [editingSaleId])

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
      const filtered = products
        .filter(
          (product) =>
            product.Name.toLowerCase().includes(productSearch.toLowerCase()) ||
            product.Code.toLowerCase().includes(productSearch.toLowerCase()),
        )
        .sort((a, b) => new Date(b.CreationDate) - new Date(a.CreationDate)) // Latest first
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

  const loadSalespersons = async () => {
    setIsLoadingSalespersons(true)
    try {
      const response = await fetch("https://localhost:7078/api/salespersons", {
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
      const transformedSalespersons = data
        .map((salesperson) => ({
          SalespersonID: salesperson.salespersonID,
          Name: salesperson.name,
          Code: salesperson.code,
          EnteredDate: salesperson.enteredDate,
          UpdatedDate: salesperson.updatedDate,
        }))
        .sort((a, b) => new Date(b.EnteredDate) - new Date(a.EnteredDate)) // Latest first

      setSalespersons(transformedSalespersons)
    } catch (error) {
      console.error("Error loading salespersons:", error)
      // Keep salespersons as empty array if there's an error
      setSalespersons([])
    } finally {
      setIsLoadingSalespersons(false)
    }
  }

  const loadProducts = async () => {
    setIsLoadingProducts(true)
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
      setIsLoadingProducts(false)
    }
  }

  // Function to refresh products (called when user clicks on search or product list)
  const refreshProducts = async () => {
    await loadProducts()
  }

  // Function to refresh salespersons
  const refreshSalespersons = async () => {
    await loadSalespersons()
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
    if (!selectedSalesperson) {
      Swal.fire({
        title: "Error!",
        text: "Please select a salesperson",
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
      return
    }

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

  // ESC key handler for SaleTab
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && editingSaleId) {
        handleClearForm()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [editingSaleId])

  return (
    <div className="w-100">
      {editingSaleId && (
        <div className="alert alert-warning d-flex justify-content-between align-items-center mb-4">
          <div>
            <i className="fas fa-edit me-2"></i>
            <strong>Editing Mode:</strong> You are currently editing Sale ID: {editingSaleId}
            <br />
            <small className="text-muted">
              <i className="fas fa-keyboard me-1"></i>
              Press <kbd>ESC</kbd> to cancel editing or switch tabs to exit
            </small>
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
          <div className="input-group">
            {/* Show live time display when not editing, static time when editing */}
            {!editingSaleId ? (
              <>
                <div className="form-control d-flex align-items-center justify-content-between bg-light">
                  <span className="fw-bold text-primary">
                    <LiveDateTime />
                  </span>
                </div>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  title="Set Custom Date/Time"
                >
                  <i className="fas fa-calendar-alt"></i>
                </button>
              </>
            ) : (
              <>
                <div className="form-control d-flex align-items-center justify-content-between bg-light">
                  <span className="fw-bold text-info">
                    <StaticDateTime dateTime={loadedSaleData?.SaleDate} />
                  </span>
                  <small className="text-muted ms-2">(Record Creation Time)</small>
                </div>
                <span className="input-group-text">
                  <i className="fas fa-calendar-check text-info"></i>
                </span>
              </>
            )}
          </div>
          <small className="text-muted">
            {!editingSaleId ? "Pakistan Time (UTC+5) - Live" : "Pakistan Time (UTC+5) - When Record Was Created"}
          </small>

          {/* Custom date picker for non-editing mode */}
          {!editingSaleId && showDatePicker && (
            <div className="mt-2 p-3 border rounded bg-white shadow-sm">
              <label className="form-label small">Set Custom Date/Time:</label>
              <div className="d-flex gap-2">
                <input
                  type="datetime-local"
                  className="form-control form-control-sm"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
                <button className="btn btn-sm btn-primary" onClick={() => setShowDatePicker(false)}>
                  <i className="fas fa-check"></i>
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    // Reset to current time
                    const now = new Date()
                    const pakistanTime = new Date(now.getTime() + 5 * 60 * 60 * 1000)
                    setSaleDate(pakistanTime.toISOString().slice(0, 16))
                    setShowDatePicker(false)
                  }}
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
              <small className="text-muted">Click check to apply or sync to reset to current time</small>
            </div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Salesperson
            <button
              className="btn btn-sm btn-outline-secondary ms-2"
              onClick={refreshSalespersons}
              disabled={isLoadingSalespersons}
              title="Refresh Salespersons List"
            >
              <i className={`fas ${isLoadingSalespersons ? "fa-spinner fa-spin" : "fa-sync-alt"}`}></i>
            </button>
          </label>
          <select
            className="form-select"
            value={selectedSalesperson}
            onChange={(e) => setSelectedSalesperson(e.target.value)}
            disabled={isLoadingSalespersons}
          >
            <option value="">--Select Sale Person--</option>
            {salespersons.map((person) => (
              <option key={person.SalespersonID} value={person.SalespersonID}>
                {person.Name} ({person.Code})
              </option>
            ))}
          </select>
          {isLoadingSalespersons && <small className="text-muted">Loading salespersons...</small>}
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-12">
          <label className="form-label">
            Enter Product...
            <button
              className="btn btn-sm btn-outline-secondary ms-2"
              onClick={refreshProducts}
              disabled={isLoadingProducts}
              title="Refresh Products List"
            >
              <i className={`fas ${isLoadingProducts ? "fa-spinner fa-spin" : "fa-sync-alt"}`}></i>
            </button>
          </label>
          <div className="d-flex gap-3 align-items-end">
            <div className="flex-grow-1" style={{ maxWidth: "400px" }}>
              <div className="position-relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-control"
                  placeholder="Search products... (Latest products shown first)"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    // Load products when user focuses on search (fresh data)
                    if (products.length === 0) {
                      refreshProducts()
                    }
                  }}
                />
                {isLoadingProducts && (
                  <div className="position-absolute end-0 top-50 translate-middle-y me-2">
                    <i className="fas fa-spinner fa-spin text-primary"></i>
                  </div>
                )}
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
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{product.Name}</strong> - {product.Code}
                          </div>
                          <div className="text-end">
                            <div className="text-primary fw-bold">${product.RetailPrice}</div>
                            <small className="text-muted">
                              Added: {new Date(product.CreationDate).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
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
                onClick={() => {
                  // Refresh products before showing modal
                  refreshProducts()
                  setShowProductListModal(true)
                }}
                style={{ width: "50px", height: "38px" }}
                title="Browse All Products (Latest First)"
              >
                <i className="fas fa-shopping-cart"></i>
              </button>
            </div>
          </div>
          {isLoadingProducts && <small className="text-muted">Loading latest products...</small>}
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
