"use client"

import { useState } from "react"

const DataTable = ({ data, columns, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  // Default to descending order by the first column (latest to oldest)
  const [sortConfig, setSortConfig] = useState({
    key: columns[0]?.key || null,
    direction: "desc",
  })

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Sort data based on current sort config
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    // Handle different data types
    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
      return sortConfig.direction === "asc" ? comparison : -comparison
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      const comparison = aValue - bValue
      return sortConfig.direction === "asc" ? comparison : -comparison
    }

    // Handle dates
    if (aValue && bValue && (aValue.includes("-") || aValue.includes("/"))) {
      const dateA = new Date(aValue)
      const dateB = new Date(bValue)
      const comparison = dateA - dateB
      return sortConfig.direction === "asc" ? comparison : -comparison
    }

    // Default string comparison
    const comparison = String(aValue).localeCompare(String(bValue))
    return sortConfig.direction === "asc" ? comparison : -comparison
  })

  const currentData = sortedData.slice(startIndex, endIndex)

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

  return (
    <div>
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="d-flex align-items-center">
            <label className="me-2">Show</label>
            <select
              className="form-select w-auto"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="ms-2">entries</span>
          </div>
        </div>
        <div className="col-md-6">
          <div className="text-end">
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              Click column headers to sort • Default: Latest first
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
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center">
                  No data available
                </td>
              </tr>
            ) : (
              currentData.map((item, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render ? column.render(item[column.key]) : item[column.key]}</td>
                  ))}
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => onEdit(item)}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(item.ProductId || item.SalespersonID)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
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
            Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} entries
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
    </div>
  )
}

export default DataTable
