"use client"

import { useState, useEffect } from "react"

const RecordsTab = ({ salesRecords, onLoadRecord, onViewRecord, onDeleteRecord }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [salespersons, setSalespersons] = useState([])

  useEffect(() => {
    loadSalespersons()
  }, [])

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

  const filteredRecords = salesRecords.filter((record) => {
    const salesperson = record.SalespersonId ? record.SalespersonId.toString() : ""
    const total = record.Total ? record.Total.toString() : ""
    const date = new Date(record.CreationDate || record.SaleDate).toLocaleDateString()

    return (
      salesperson.includes(searchTerm) ||
      total.includes(searchTerm) ||
      date.includes(searchTerm) ||
      (record.Comments && record.Comments.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRecords = filteredRecords.slice(startIndex, endIndex)

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
          <input
            type="text"
            className="form-control"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Salesperson</th>
              <th>Total</th>
              <th>Items Count</th>
              <th>Comments</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">
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
                      : "Never"}
                  </td>
                  <td>{getSalespersonName(record.SalespersonId)}</td>
                  <td>${record.Total.toFixed(2)}</td>
                  <td>{record.SaleItems ? record.SaleItems.length : 0}</td>
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} entries
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
