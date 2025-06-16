"use client"

import { useState, useEffect } from "react"
import SalespersonModal from "./SalespersonModal"
import DataTable from "./DataTable"
import Swal from "sweetalert2"

const SalespersonComponent = () => {
  const [salespersons, setSalespersons] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingSalesperson, setEditingSalesperson] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadSalespersons()
  }, [])

  const loadSalespersons = () => {
    const savedSalespersons = localStorage.getItem("salespersons")
    if (savedSalespersons) {
      setSalespersons(JSON.parse(savedSalespersons))
    }
  }

  const handleAddSalesperson = () => {
    setEditingSalesperson(null)
    setShowModal(true)
  }

  const handleEditSalesperson = (salesperson) => {
    setEditingSalesperson(salesperson)
    setShowModal(true)
  }

  const handleDeleteSalesperson = (salespersonId) => {
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
        // More efficient: Just remove the specific salesperson
        const savedSalespersons = JSON.parse(localStorage.getItem("salespersons") || "[]")
        const index = savedSalespersons.findIndex((s) => s.SalespersonID === salespersonId)

        if (index > -1) {
          savedSalespersons.splice(index, 1) // Remove just this one salesperson
          localStorage.setItem("salespersons", JSON.stringify(savedSalespersons))
          setSalespersons(savedSalespersons) // Update state
        }

        Swal.fire({
          title: "Deleted!",
          text: "Salesperson has been deleted.",
          icon: "success",
          confirmButtonColor: "#8b5cf6",
        })
      }
    })
  }

  const handleSaveSalesperson = (salespersonData) => {
    if (editingSalesperson) {
      // Check if any data has actually changed
      const hasChanges =
        editingSalesperson.Name !== salespersonData.Name || editingSalesperson.Code !== salespersonData.Code

      if (!hasChanges) {
        Swal.fire({
          title: "No Changes!",
          text: "No changes were made to the salesperson",
          icon: "info",
          confirmButtonColor: "#8b5cf6",
        })
        setShowModal(false)
        return
      }

      // More efficient: Just update the specific salesperson
      const savedSalespersons = JSON.parse(localStorage.getItem("salespersons") || "[]")
      const index = savedSalespersons.findIndex((s) => s.SalespersonID === editingSalesperson.SalespersonID)

      if (index > -1) {
        savedSalespersons[index] = {
          ...salespersonData,
          SalespersonID: editingSalesperson.SalespersonID,
          EnteredDate: editingSalesperson.EnteredDate,
          UpdatedDate: new Date().toISOString(),
        }
        localStorage.setItem("salespersons", JSON.stringify(savedSalespersons))
        setSalespersons(savedSalespersons) // Update state
      }

      Swal.fire({
        title: "Success!",
        text: "Salesperson updated successfully",
        icon: "success",
        confirmButtonColor: "#8b5cf6",
      })
    } else {
      // More efficient: Just add the new salesperson
      const savedSalespersons = JSON.parse(localStorage.getItem("salespersons") || "[]")
      const now = new Date().toISOString()
      const newSalesperson = {
        ...salespersonData,
        SalespersonID: Date.now(),
        EnteredDate: now,
        UpdatedDate: null,
      }

      savedSalespersons.push(newSalesperson) // Just add this one salesperson
      localStorage.setItem("salespersons", JSON.stringify(savedSalespersons))
      setSalespersons(savedSalespersons) // Update state

      Swal.fire({
        title: "Success!",
        text: "Salesperson added successfully",
        icon: "success",
        confirmButtonColor: "#8b5cf6",
      })
    }

    setShowModal(false)
  }

  const filteredSalespersons = salespersons.filter(
    (salesperson) =>
      salesperson.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salesperson.Code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns = [
    { key: "Name", label: "Salesperson Name" },
    { key: "Code", label: "Code" },
    {
      key: "EnteredDate",
      label: "Created At",
      render: (value) =>
        new Date(value).toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
    },
    {
      key: "UpdatedDate",
      label: "Updated At",
      render: (value) =>
        value
          ? new Date(value).toLocaleString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })
          : "-",
    },
  ]

  return (
    <div className="full-page-layout">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-left">
          <div className="page-title">
            <i className="fas fa-user-tie"></i>
            <h1>Salesperson Management</h1>
          </div>
          <p className="page-subtitle">Manage your sales team and representatives</p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary btn-lg" onClick={handleAddSalesperson}>
            <i className="fas fa-plus me-2"></i>
            Add New Salesperson
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="controls-left">
          <div className="search-wrapper">
            <i className="fas fa-search"></i>
            <input
              type="text"
              className="form-control search-input"
              placeholder="Search salespersons by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="controls-right">
          <div className="stats-display">
            <span className="stats-number">{filteredSalespersons.length}</span>
            <span className="stats-label">{filteredSalespersons.length === 1 ? "Salesperson" : "Salespersons"}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="page-content">
        <DataTable
          data={filteredSalespersons}
          columns={columns}
          onEdit={handleEditSalesperson}
          onDelete={handleDeleteSalesperson}
          defaultSortConfig={{ key: "EnteredDate", direction: "desc" }}
        />
      </div>

      {/* Footer Stats */}
      {salespersons.length > 0 && (
        <div className="page-footer">
          <div className="footer-stats">
            <div className="stat-item">
              <div className="stat-value">{salespersons.length}</div>
              <div className="stat-label">Total Salespersons</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {
                  salespersons.filter((s) => new Date(s.EnteredDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                    .length
                }
              </div>
              <div className="stat-label">Added This Month</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{salespersons.filter((s) => s.UpdatedDate).length}</div>
              <div className="stat-label">Recently Updated</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {salespersons.length > 0
                  ? Math.round(
                      salespersons.filter(
                        (s) => new Date(s.EnteredDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      ).length / 7,
                    )
                  : 0}
              </div>
              <div className="stat-label">Weekly Average</div>
            </div>
          </div>
        </div>
      )}

      <SalespersonModal
        show={showModal}
        onHide={() => setShowModal(false)}
        salesperson={editingSalesperson}
        onSave={handleSaveSalesperson}
      />
    </div>
  )
}

export default SalespersonComponent
