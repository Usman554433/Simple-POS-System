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
    let updatedRecords

    if (isEditing && originalSaleId) {
      const originalRecord = salesRecords.find((record) => record.SaleId === originalSaleId)

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

      updatedRecords = salesRecords.map((record) =>
        record.SaleId === originalSaleId
          ? {
              ...saleData,
              SaleId: originalSaleId,
              CreationDate: originalRecord.CreationDate || originalRecord.SaleDate,
              UpdatedDate: new Date().toISOString(),
            }
          : record,
      )

      Swal.fire({
        title: "Updated!",
        text: "Sale record has been updated successfully.",
        icon: "success",
        confirmButtonColor: "#8b5cf6",
      })
    } else {
      const now = new Date().toISOString()
      const newSale = {
        SaleId: Date.now(),
        CreationDate: now,
        UpdatedDate: null,
        ...saleData,
      }
      updatedRecords = [...salesRecords, newSale]

      Swal.fire({
        title: "Success!",
        text: "Sale record has been saved successfully.",
        icon: "success",
        confirmButtonColor: "#8b5cf6",
      })
    }

    localStorage.setItem("salesRecords", JSON.stringify(updatedRecords))
    setSalesRecords(updatedRecords)

    setEditingSaleId(null)
    setLoadedSaleData(null)
  }

  const loadSaleRecord = (saleRecord) => {
    setLoadedSaleData(saleRecord)
    setEditingSaleId(saleRecord.SaleId)
    setActiveTab("sale")
  }

  const viewSaleRecord = (saleRecord) => {
    const itemsList = saleRecord.SaleItems
      ? saleRecord.SaleItems.map(
          (item, index) =>
            `${index + 1}. ${item.Name} (${item.Code}) - Qty: ${item.Quantity}, Price: $${item.RetailPrice}, Discount: ${item.Discount}%`,
        ).join("<br>")
      : "No items"

    Swal.fire({
      title: `Sale Details - ID: ${saleRecord.SaleId}`,
      html: `
      <div class="text-start">
        <p><strong>Date:</strong> ${new Date(saleRecord.CreationDate || saleRecord.SaleDate).toLocaleString()}</p>
        <p><strong>Updated:</strong> ${saleRecord.UpdatedDate ? new Date(saleRecord.UpdatedDate).toLocaleString() : "Never"}</p>
        <p><strong>Salesperson:</strong> ${getSalespersonName(saleRecord.SalespersonId)}</p>
        <p><strong>Total:</strong> $${saleRecord.Total.toFixed(2)}</p>
        <p><strong>Comments:</strong> ${saleRecord.Comments || "None"}</p>
        <hr>
        <p><strong>Items:</strong></p>
        <div>${itemsList}</div>
      </div>
    `,
      icon: "info",
      confirmButtonColor: "#8b5cf6",
      width: "600px",
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
        const updatedRecords = salesRecords.filter((record) => record.SaleId !== saleId)
        localStorage.setItem("salesRecords", JSON.stringify(updatedRecords))
        setSalesRecords(updatedRecords)

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
