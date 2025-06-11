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

  const loadSalesRecords = () => {
    const savedRecords = localStorage.getItem("salesRecords")
    if (savedRecords) {
      setSalesRecords(JSON.parse(savedRecords))
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

  const saveSalesRecord = (saleData, isEditing = false, originalSaleId = null) => {
    if (isEditing && originalSaleId) {
      const savedRecords = JSON.parse(localStorage.getItem("salesRecords") || "[]")
      const originalRecord = savedRecords.find((record) => record.SaleId === originalSaleId)

      if (!originalRecord) return

      // Check if any data has actually changed
      const hasChanges =
        originalRecord.Total !== saleData.Total ||
        originalRecord.SalespersonId !== saleData.SalespersonId ||
        originalRecord.Comments !== saleData.Comments ||
        JSON.stringify(originalRecord.SaleItems) !== JSON.stringify(saleData.SaleItems)

      if (!hasChanges) {
        Swal.fire({
          title: "No Changes!",
          text: "No changes were made to the sale record",
          icon: "info",
          confirmButtonColor: "#8b5cf6",
        })
        setEditingSaleId(null)
        setLoadedSaleData(null)
        return
      }

      // More efficient: Just update the specific record
      const index = savedRecords.findIndex((record) => record.SaleId === originalSaleId)

      if (index > -1) {
        savedRecords[index] = {
          ...saleData,
          SaleId: originalSaleId,
          CreationDate: originalRecord.CreationDate || originalRecord.SaleDate,
          UpdatedDate: new Date().toISOString(),
        }
        localStorage.setItem("salesRecords", JSON.stringify(savedRecords))
        setSalesRecords(savedRecords) // Update state
      }

      Swal.fire({
        title: "Updated!",
        text: "Sale record has been updated successfully.",
        icon: "success",
        confirmButtonColor: "#8b5cf6",
      })
    } else {
      // More efficient: Just add the new record
      const savedRecords = JSON.parse(localStorage.getItem("salesRecords") || "[]")
      const now = new Date().toISOString()
      const newSale = {
        SaleId: Date.now(),
        CreationDate: now,
        UpdatedDate: null,
        ...saleData,
      }

      savedRecords.push(newSale) // Just add this one record
      localStorage.setItem("salesRecords", JSON.stringify(savedRecords))
      setSalesRecords(savedRecords) // Update state

      Swal.fire({
        title: "Success!",
        text: "Sale record has been saved successfully.",
        icon: "success",
        confirmButtonColor: "#8b5cf6",
      })
    }

    setEditingSaleId(null)
    setLoadedSaleData(null)
  }

  const loadSaleRecord = (saleRecord) => {
    setLoadedSaleData(saleRecord)
    setEditingSaleId(saleRecord.SaleId)
    setActiveTab("sale")
  }

  const viewSaleRecord = (saleRecord) => {
    const itemsTable =
      saleRecord.SaleItems && saleRecord.SaleItems.length > 0
        ? `
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
              ${saleRecord.SaleItems.map((item, index) => {
                const subtotal = item.RetailPrice * item.Quantity
                const discountAmount = (subtotal * item.Discount) / 100
                const finalAmount = subtotal - discountAmount

                return `
                  <tr style="border-bottom: 1px solid #eee; ${index % 2 === 0 ? "background-color: #f9f9f9;" : ""}">
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #8b5cf6;">${index + 1}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">
                      <div style="font-weight: bold; color: #333;">${item.Name}</div>
                      <div style="font-size: 12px; color: #666;">Code: ${item.Code}</div>
                    </td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${item.Quantity}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #333;">$${item.RetailPrice.toFixed(2)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center; ${item.Discount > 0 ? "color: #e74c3c; font-weight: bold;" : "color: #666;"}">${item.Discount}%</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #27ae60;">$${finalAmount.toFixed(2)}</td>
                  </tr>
                `
              }).join("")}
            </tbody>
            <tfoot>
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td colspan="5" style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">Total:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px; color: #8b5cf6;">$${saleRecord.Total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `
        : '<p style="color: #666; font-style: italic; margin-top: 15px;">No items in this sale</p>'

    Swal.fire({
      title: `Sale Details - ID: ${saleRecord.SaleId}`,
      html: `
        <div style="text-align: left; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
              <div>
                <strong style="color: #8b5cf6;">📅 Date:</strong><br>
                <span style="color: #333;">${new Date(saleRecord.CreationDate || saleRecord.SaleDate).toLocaleString()}</span>
              </div>
              <div>
                <strong style="color: #8b5cf6;">🔄 Updated:</strong><br>
                <span style="color: #333;">${saleRecord.UpdatedDate ? new Date(saleRecord.UpdatedDate).toLocaleString() : "Never"}</span>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong style="color: #8b5cf6;">👤 Salesperson:</strong><br>
                <span style="color: #333;">${getSalespersonName(saleRecord.SalespersonId)}</span>
              </div>
              <div>
                <strong style="color: #8b5cf6;">💰 Total:</strong><br>
                <span style="color: #27ae60; font-weight: bold; font-size: 18px;">$${saleRecord.Total.toFixed(2)}</span>
              </div>
            </div>
            ${
              saleRecord.Comments
                ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                <strong style="color: #8b5cf6;">💬 Comments:</strong><br>
                <span style="color: #333; font-style: italic;">${saleRecord.Comments}</span>
              </div>
            `
                : ""
            }
          </div>
          
          <div>
            <h4 style="color: #8b5cf6; margin-bottom: 10px; display: flex; align-items: center;">
              🛍️ Items (${saleRecord.SaleItems ? saleRecord.SaleItems.length : 0})
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
  }

  const deleteSaleRecord = (saleId) => {
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
        // More efficient: Just remove the specific record
        const savedRecords = JSON.parse(localStorage.getItem("salesRecords") || "[]")
        const index = savedRecords.findIndex((record) => record.SaleId === saleId)

        if (index > -1) {
          savedRecords.splice(index, 1) // Remove just this one record
          localStorage.setItem("salesRecords", JSON.stringify(savedRecords))
          setSalesRecords(savedRecords) // Update state
        }

        if (editingSaleId === saleId) {
          setEditingSaleId(null)
          setLoadedSaleData(null)
        }

        Swal.fire({
          title: "Deleted!",
          text: "Sale record has been deleted.",
          icon: "success",
          confirmButtonColor: "#8b5cf6",
        })
      }
    })
  }

  const clearEditingState = () => {
    setEditingSaleId(null)
    setLoadedSaleData(null)
  }

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
            onClick={() => setActiveTab("sale")}
          >
            <i className="fas fa-shopping-cart me-2"></i>
            <span>New Sale</span>
            {editingSaleId && <span className="badge bg-warning ms-2">Editing</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "records" ? "active" : ""}`}
            onClick={() => setActiveTab("records")}
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
