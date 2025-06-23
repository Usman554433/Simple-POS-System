"use client"

import { useState, useEffect } from "react"
import SaleTab from "./SaleTab"
import RecordsTab from "./RecordsTab"
import Swal from "sweetalert2"

const PointOfSaleComponent = () => {
  const [activeTab, setActiveTab] = useState("sale")
  const [salesRecords, setSalesRecords] = useState([])
  const [loadedSaleData, setLoadedSaleData] = useState(null)
  const [editingSaleId, setEditingSaleId] = useState(null)
  const [salespersons, setSalespersons] = useState([])

  useEffect(() => {
    loadSalesRecords()
    loadSalespersons()
  }, [])

  const loadSalesRecords = async () => {
    try {
      const response = await fetch("https://localhost:7078/api/salerecords", {
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
      const transformedRecords = data.map((record) => ({
        SaleId: record.saleId,
        SaleDate: record.saleDate,
        CreationDate: record.saleDate, // Use saleDate as CreationDate for list view
        Total: record.total,
        SalespersonName: record.salespersonName,
        UpdatedDate: record.editDate && record.editDate !== record.saleDate ? record.editDate : null, // Only show if actually updated
        Comments: record.comments,
        // Note: SaleItems are not included in the list view, will be fetched separately when needed
      }))

      setSalesRecords(transformedRecords)
    } catch (error) {
      console.error("Error loading sales records:", error)
      // Keep salesRecords as empty array if there's an error
      setSalesRecords([])
    }
  }

  const loadSalespersons = () => {
    const savedSalespersons = localStorage.getItem("salespersons")
    if (savedSalespersons) {
      setSalespersons(JSON.parse(savedSalespersons))
    }
  }

  const getSalespersonName = (salespersonId) => {
    const salesperson = salespersons.find((s) => s.SalespersonID == salespersonId)
    return salesperson ? salesperson.Name : `ID: ${salespersonId}`
  }

  const saveSalesRecord = async (saleData, isEditing = false, originalSaleId = null) => {
    try {
      if (isEditing && originalSaleId) {
        // Get the original record details first
        const detailResponse = await fetch(`https://localhost:7078/api/salerecords/${originalSaleId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!detailResponse.ok) {
          throw new Error(`Failed to fetch original record: ${detailResponse.status}`)
        }

        const originalRecord = await detailResponse.json()

        // Prepare update data
        const updateData = {
          saleId: originalSaleId,
          total: saleData.Total,
          creationDate: originalRecord.creationDate,
          salespersonId: saleData.SalespersonId,
          comments: saleData.Comments,
          saleItems: saleData.SaleItems.map((item) => ({
            productId: item.ProductId,
            retailPrice: item.RetailPrice,
            quantity: item.Quantity,
            discount: item.Discount,
          })),
        }

        const response = await fetch("https://localhost:7078/api/salerecords/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        Swal.fire({
          title: "Updated!",
          text: "Sale record has been updated successfully.",
          icon: "success",
          confirmButtonColor: "#8b5cf6",
        })
      } else {
        // Add new sale record
        const addData = {
          salespersonId: saleData.SalespersonId,
          total: saleData.Total,
          comments: saleData.Comments,
          saleItems: saleData.SaleItems.map((item) => ({
            productId: item.ProductId,
            retailPrice: item.RetailPrice,
            quantity: item.Quantity,
            discount: item.Discount,
          })),
        }

        const response = await fetch("https://localhost:7078/api/salerecords/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(addData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        Swal.fire({
          title: "Success!",
          text: "Sale record has been saved successfully.",
          icon: "success",
          confirmButtonColor: "#8b5cf6",
        })
      }

      // Reload sales records after successful operation
      await loadSalesRecords()
    } catch (error) {
      console.error("Error saving sale record:", error)
      Swal.fire({
        title: "Error!",
        text: `Failed to save sale record: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
    }

    setEditingSaleId(null)
    setLoadedSaleData(null)
  }

  const loadSaleRecord = async (saleRecord) => {
    try {
      // Fetch detailed record from backend
      const response = await fetch(`https://localhost:7078/api/salerecords/${saleRecord.SaleId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const detailedRecord = await response.json()

      // Load products to get product details for sale items
      const productsResponse = await fetch("https://localhost:7078/api/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      let products = []
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        products = productsData.map((product) => ({
          ProductId: product.productId,
          Name: product.name,
          Code: product.code,
          RetailPrice: product.retailPrice,
        }))
      }

      // Transform the detailed record to match frontend format
      const transformedRecord = {
        SaleId: detailedRecord.saleId,
        CreationDate: detailedRecord.creationDate,
        UpdatedDate: detailedRecord.updatedDate,
        SalespersonId: detailedRecord.salespersonId,
        Total: detailedRecord.total,
        Comments: detailedRecord.comments,
        SaleItems: [], // Will be populated from the backend if available
      }

      // If the backend provides sale items, transform them
      if (detailedRecord.saleItems && Array.isArray(detailedRecord.saleItems)) {
        transformedRecord.SaleItems = detailedRecord.saleItems.map((item) => {
          // Find product details
          const product = products.find((p) => p.ProductId === item.productId)
          return {
            ProductId: item.productId,
            Name: product ? product.Name : `Product ID: ${item.productId}`,
            Code: product ? product.Code : `P${item.productId}`,
            RetailPrice: item.retailPrice,
            Quantity: item.quantity,
            Discount: item.discount,
          }
        })
      }

      setLoadedSaleData(transformedRecord)
      setEditingSaleId(transformedRecord.SaleId)
      setActiveTab("sale")
    } catch (error) {
      console.error("Error loading sale record details:", error)
      Swal.fire({
        title: "Error!",
        text: `Failed to load sale record details: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
    }
  }

  const viewSaleRecord = async (saleRecord) => {
    try {
      // Fetch detailed record from backend
      const response = await fetch(`https://localhost:7078/api/salerecords/${saleRecord.SaleId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const detailedRecord = await response.json()

      // Load products to get product details for sale items
      const productsResponse = await fetch("https://localhost:7078/api/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      let products = []
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        products = productsData.map((product) => ({
          ProductId: product.productId,
          Name: product.name,
          Code: product.code,
          RetailPrice: product.retailPrice,
        }))
      }

      // Build items table if sale items exist
      let itemsTable = ""
      if (detailedRecord.saleItems && Array.isArray(detailedRecord.saleItems) && detailedRecord.saleItems.length > 0) {
        itemsTable = `
      <div style="margin-top: 15px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #8b5cf6; color: white;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">#</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Product</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Qty</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Price</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Discount</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${detailedRecord.saleItems
              .map((item, index) => {
                const product = products.find((p) => p.ProductId === item.productId)
                const productName = product ? product.Name : `Product ID: ${item.productId}`
                const productCode = product ? product.Code : `P${item.productId}`

                const subtotal = item.retailPrice * item.quantity
                const discountAmount = (subtotal * item.discount) / 100
                const finalAmount = subtotal - discountAmount

                return `
                <tr style="border-bottom: 1px solid #eee; ${index % 2 === 0 ? "background-color: #f9f9f9;" : ""}">
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #8b5cf6;">${index + 1}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">
                    <div style="font-weight: bold; color: #333;">${productName}</div>
                    <div style="font-size: 12px; color: #666;">Code: ${productCode}</div>
                  </td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${item.quantity}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #333;">$${item.retailPrice.toFixed(2)}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center; ${item.discount > 0 ? "color: #e74c3c; font-weight: bold;" : "color: #666;"}">${item.discount}%</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #27ae60;">$${finalAmount.toFixed(2)}</td>
                </tr>
              `
              })
              .join("")}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8f9fa; font-weight: bold;">
              <td colspan="5" style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">Total:</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px; color: #8b5cf6;">$${detailedRecord.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `
      } else {
        itemsTable =
          '<p style="color: #666; font-style: italic; margin-top: 15px;">No items found in this sale record</p>'
      }

      Swal.fire({
        title: `Sale Details - ID: ${detailedRecord.saleId}`,
        html: `
      <div style="text-align: left; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div>
              <strong style="color: #8b5cf6;">📅 Created:</strong><br>
              <span style="color: #333;">${new Date(detailedRecord.creationDate).toLocaleString()}</span>
            </div>
            <div>
              <strong style="color: #8b5cf6;">🔄 Updated:</strong><br>
              <span style="color: #333;">${detailedRecord.updatedDate ? new Date(detailedRecord.updatedDate).toLocaleString() : "Never"}</span>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong style="color: #8b5cf6;">👤 Salesperson ID:</strong><br>
              <span style="color: #333;">${detailedRecord.salespersonId}</span>
            </div>
            <div>
              <strong style="color: #8b5cf6;">💰 Total:</strong><br>
              <span style="color: #27ae60; font-weight: bold; font-size: 18px;">$${detailedRecord.total.toFixed(2)}</span>
            </div>
          </div>
          ${
            detailedRecord.comments
              ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
              <strong style="color: #8b5cf6;">💬 Comments:</strong><br>
              <span style="color: #333; font-style: italic;">${detailedRecord.comments}</span>
            </div>
          `
              : ""
          }
        </div>
        
        <div>
          <h4 style="color: #8b5cf6; margin-bottom: 10px; display: flex; align-items: center;">
            🛍️ Items (${detailedRecord.saleItems ? detailedRecord.saleItems.length : 0})
          </h4>
          ${itemsTable}
        </div>
      </div>
    `,
        icon: "info",
        confirmButtonColor: "#8b5cf6",
        width: "800px",
        customClass: {
          popup: "swal-wide-popup",
        },
      })
    } catch (error) {
      console.error("Error viewing sale record:", error)
      Swal.fire({
        title: "Error!",
        text: `Failed to load sale record details: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
    }
  }

  const deleteSaleRecord = async (saleId) => {
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
      try {
        const response = await fetch("https://localhost:7078/api/salerecords/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Id: saleId,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Clear editing state if we're deleting the currently edited record
        if (editingSaleId === saleId) {
          setEditingSaleId(null)
          setLoadedSaleData(null)
        }

        // Reload sales records after successful deletion
        await loadSalesRecords()

        Swal.fire({
          title: "Deleted!",
          text: "Sale record has been deleted.",
          icon: "success",
          confirmButtonColor: "#8b5cf6",
        })
      } catch (error) {
        console.error("Error deleting sale record:", error)
        Swal.fire({
          title: "Error!",
          text: `Failed to delete sale record: ${error.message}`,
          icon: "error",
          confirmButtonColor: "#8b5cf6",
        })
      }
    }
  }

  const clearEditingState = () => {
    setEditingSaleId(null)
    setLoadedSaleData(null)
  }

  // Add this useEffect after the existing useEffects
  useEffect(() => {
    // Clear editing mode when switching away from sale tab
    if (activeTab !== "sale" && editingSaleId) {
      setEditingSaleId(null)
      setLoadedSaleData(null)
    }
  }, [activeTab, editingSaleId])

  // Add ESC key handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && editingSaleId) {
        // Show confirmation before clearing editing mode
        Swal.fire({
          title: "Cancel Editing?",
          text: "Are you sure you want to cancel editing? All unsaved changes will be lost.",
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#8b5cf6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, cancel editing",
          cancelButtonText: "Continue editing",
        }).then((result) => {
          if (result.isConfirmed) {
            setEditingSaleId(null)
            setLoadedSaleData(null)

            Swal.fire({
              title: "Editing Cancelled",
              text: "You have exited editing mode.",
              icon: "info",
              confirmButtonColor: "#8b5cf6",
              timer: 2000,
              showConfirmButton: false,
            })
          }
        })
      }
    }

    // Only add listener when in editing mode
    if (editingSaleId) {
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [editingSaleId])

  return (
    <div className="pos-layout">
      {/* Vertical Sidebar */}
      <div className="pos-sidebar">
        <div className="sidebar-header">
          <h5 className="mb-0">
            <i className="fas fa-cash-register me-2"></i>
            Point of Sale
          </h5>
        </div>

        <div className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === "sale" ? "active" : ""}`}
            onClick={() => {
              if (editingSaleId && activeTab !== "sale") {
                // Show notification when switching to sale tab while editing
                Swal.fire({
                  title: "Editing Mode Active",
                  text: `You are currently editing Sale ID: ${editingSaleId}`,
                  icon: "info",
                  confirmButtonColor: "#8b5cf6",
                  timer: 2000,
                  showConfirmButton: false,
                })
              }
              setActiveTab("sale")
            }}
          >
            <i className="fas fa-shopping-cart me-2"></i>
            <span>New Sale</span>
            {editingSaleId && <span className="badge bg-warning ms-2">Editing</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "records" ? "active" : ""}`}
            onClick={() => {
              if (editingSaleId) {
                // Show confirmation when trying to leave editing mode
                Swal.fire({
                  title: "Switch to Records?",
                  text: "You are currently editing a sale. Switching tabs will cancel editing mode.",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#8b5cf6",
                  cancelButtonColor: "#d33",
                  confirmButtonText: "Yes, switch tabs",
                  cancelButtonText: "Stay in editing",
                }).then((result) => {
                  if (result.isConfirmed) {
                    setEditingSaleId(null)
                    setLoadedSaleData(null)
                    setActiveTab("records")

                    Swal.fire({
                      title: "Editing Cancelled",
                      text: "You have switched to Sales Records. Editing mode has been cleared.",
                      icon: "info",
                      confirmButtonColor: "#8b5cf6",
                      timer: 2000,
                      showConfirmButton: false,
                    })
                  }
                })
              } else {
                setActiveTab("records")
              }
            }}
          >
            <i className="fas fa-history me-2"></i>
            <span>Sales Records</span>
            <span className="badge bg-secondary ms-2">{salesRecords.length}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pos-content">
        {activeTab === "sale" && (
          <SaleTab
            onSaveSale={saveSalesRecord}
            loadedSaleData={loadedSaleData}
            editingSaleId={editingSaleId}
            onClearEditing={clearEditingState}
            onDeleteSale={deleteSaleRecord}
          />
        )}
        {activeTab === "records" && (
          <RecordsTab
            salesRecords={salesRecords}
            onLoadRecord={loadSaleRecord}
            onViewRecord={viewSaleRecord}
            onDeleteRecord={deleteSaleRecord}
          />
        )}
      </div>
    </div>
  )
}

export default PointOfSaleComponent
