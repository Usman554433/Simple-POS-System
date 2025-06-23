"use client"

import { useState, useEffect } from "react"

const RecordsTab = ({ salesRecords, onLoadRecord, onViewRecord, onDeleteRecord }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [salespersons, setSalespersons] = useState([])
  // Default to descending order by SaleId (latest first)
  const [sortConfig, setSortConfig] = useState({ key: "SaleId", direction: "desc" })

  useEffect(() => {
    loadSalespersons()
  }, [])

  const loadSalespersons = () => {
    const savedSalespersons = localStorage.getItem("salespersons")
    if (savedSalespersons) {
      setSalespersons(JSON.parse(savedSalespersons))
    }
  }

  const getSalespersonName = (record) => {
    // If we have salespersonName from the backend, use it
    if (record.SalespersonName) {
      return record.SalespersonName
    }

    // Otherwise, try to find by ID
    if (record.SalespersonId) {
      const salesperson = salespersons.find((s) => s.SalespersonID == record.SalespersonId)
      return salesperson ? salesperson.Name : `ID: ${record.SalespersonId}`
    }

    return "Unknown"
  }

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const filteredRecords = salesRecords.filter((record) => {
    const salesperson = getSalespersonName(record)
    const total = record.Total ? record.Total.toString() : ""
    const date = new Date(record.CreationDate || record.SaleDate).toLocaleDateString()

    return (
      salesperson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      total.includes(searchTerm) ||
      date.includes(searchTerm) ||
      (record.Comments && record.Comments.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  // Sort filtered records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortConfig.key) return 0

    let aValue, bValue

    switch (sortConfig.key) {
      case "SaleId":
        aValue = a.SaleId
        bValue = b.SaleId
        break
      case "CreationDate":
        aValue = new Date(a.CreationDate || a.SaleDate)
        bValue = new Date(b.CreationDate || b.SaleDate)
        break
      case "UpdatedDate":
        aValue = a.UpdatedDate ? new Date(a.UpdatedDate) : new Date(0)
        bValue = b.UpdatedDate ? new Date(b.UpdatedDate) : new Date(0)
        break
      case "Salesperson":
        aValue = getSalespersonName(a).toLowerCase()
        bValue = getSalespersonName(b).toLowerCase()
        break
      case "Total":
        aValue = a.Total
        bValue = b.Total
        break
      case "Comments":
        aValue = (a.Comments || "").toLowerCase()
        bValue = (b.Comments || "").toLowerCase()
        break
      default:
        return 0
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      const comparison = aValue - bValue
      return sortConfig.direction === "asc" ? comparison : -comparison
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      const comparison = aValue - bValue
      return sortConfig.direction === "asc" ? comparison : -comparison
    }

    const comparison = String(aValue).localeCompare(String(bValue))
    return sortConfig.direction === "asc" ? comparison : -comparison
  })

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRecords = sortedRecords.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
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

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <i className="fas fa-sort text-muted ms-1" style={{ opacity: 0.5 }}></i>
    }
    return sortConfig.direction === "asc" ? (
      <i className="fas fa-sort-up text-primary ms-1"></i>
    ) : (
      <i className="fas fa-sort-down text-primary ms-1"></i>
    )
  }

  const columns = [
    { key: "SaleId", label: "Sale ID" },
    { key: "CreationDate", label: "Created At" },
    { key: "UpdatedDate", label: "Updated At" },
    { key: "Salesperson", label: "Salesperson" },
    { key: "Total", label: "Total" },
    { key: "Comments", label: "Comments" },
  ]

  return (
    <div>
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
          <div className="d-flex justify-content-between align-items-center">
            <input
              type="text"
              className="form-control me-3"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <small className="text-muted text-nowrap">
              <i className="fas fa-info-circle me-1"></i>
              Latest first
            </small>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSort(column.key)}
                  className="sortable-header"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>{column.label}</span>
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  {salesRecords.length === 0 ? "No sales records found" : "No records match your search"}
                </td>
              </tr>
            ) : (
              currentRecords.map((record) => (
                <tr key={record.SaleId}>
                  <td>{record.SaleId}</td>
                  <td>
                    {new Date(record.CreationDate || record.SaleDate).toLocaleString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </td>
                  <td>
                    {record.UpdatedDate
                      ? new Date(record.UpdatedDate).toLocaleString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })
                      : "-"}
                  </td>
                  <td>{getSalespersonName(record)}</td>
                  <td>${record.Total.toFixed(2)}</td>
                  <td>{record.Comments || "-"}</td>
                  <td>
                    <div className="btn-group" role="group">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onViewRecord(record)}
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-info"
                        onClick={() => onLoadRecord(record)}
                        title="Load for Editing"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onDeleteRecord(record.SaleId)}
                        title="Delete Record"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="row">
        <div className="col-md-6">
          <p className="text-muted">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedRecords.length)} of {sortedRecords.length} entries
            {sortConfig.key && (
              <span className="ms-2">
                <i className="fas fa-filter text-primary"></i>
                <small>
                  {" "}
                  Sorted by {columns.find((col) => col.key === sortConfig.key)?.label} (
                  {sortConfig.direction === "desc" ? "Latest first" : "Oldest first"})
                </small>
              </span>
            )}
          </p>
        </div>
        <div className="col-md-6">
          {totalPages > 1 && (
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
          )}
        </div>
      </div>

      {salesRecords.length > 0 && (
        <div className="alert alert-info mt-3">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Total Sales Records:</strong> {salesRecords.length} | <strong>Total Revenue:</strong> $
          {salesRecords.reduce((sum, record) => sum + record.Total, 0).toFixed(2)}
        </div>
      )}
    </div>
  )
}

export default RecordsTab
