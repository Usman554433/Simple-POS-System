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
  const [loading, setLoading] = useState(false)

  const API_BASE_URL = "https://localhost:7078/api/salespersons"

  useEffect(() => {
    loadSalespersons()
  }, [])

  const loadSalespersons = async () => {
    setLoading(true)
    try {
      const response = await fetch(API_BASE_URL, {
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
      const transformedSalespersons = data.map((salesperson) => ({
        SalespersonID: salesperson.salespersonID,
        Name: salesperson.name,
        Code: salesperson.code,
        EnteredDate: salesperson.enteredDate,
        UpdatedDate: salesperson.updatedDate,
      }))

      setSalespersons(transformedSalespersons)
    } catch (error) {
      console.error("Error loading salespersons:", error)
      Swal.fire({
        title: "Error!",
        text: `Failed to load salespersons: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
    } finally {
      setLoading(false)
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

  const handleDeleteSalesperson = async (salespersonId) => {
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
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Id: salespersonId,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Remove salesperson from local state
        setSalespersons(salespersons.filter((s) => s.SalespersonID !== salespersonId))

        Swal.fire({
          title: "Deleted!",
          text: "Salesperson has been deleted.",
          icon: "success",
          confirmButtonColor: "#8b5cf6",
        })
      } catch (error) {
        console.error("Error deleting salesperson:", error)
        Swal.fire({
          title: "Error!",
          text: `Failed to delete salesperson: ${error.message}`,
          icon: "error",
          confirmButtonColor: "#8b5cf6",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSaveSalesperson = async (salespersonData) => {
    setLoading(true)

    try {
      if (editingSalesperson) {
        // Check if any changes were made
        const hasChanges = editingSalesperson.Name !== salespersonData.Name

        if (!hasChanges) {
          setLoading(false)
          setShowModal(false)
          Swal.fire({
            title: "No Changes Made!",
            text: "No changes were detected. The salesperson remains unchanged.",
            icon: "info",
            confirmButtonColor: "#8b5cf6",
          })
          return
        }

        // Update existing salesperson
        const updateData = {
          SalespersonID: editingSalesperson.SalespersonID,
          Name: salespersonData.Name,
        }

        const response = await fetch(`${API_BASE_URL}/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Update salesperson in local state
        setSalespersons(
          salespersons.map((s) =>
            s.SalespersonID === editingSalesperson.SalespersonID
              ? {
                  ...s,
                  Name: salespersonData.Name,
                  UpdatedDate: new Date().toISOString(),
                }
              : s,
          ),
        )

        Swal.fire({
          title: "Success!",
          text: "Salesperson updated successfully",
          icon: "success",
          confirmButtonColor: "#8b5cf6",
        })
      } else {
        // Add new salesperson (existing code remains the same)
        const addData = {
          Name: salespersonData.Name,
          Code: salespersonData.Code,
        }

        const response = await fetch(`${API_BASE_URL}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(addData),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
        }

        // Reload salespersons to get the new salesperson with server-generated ID
        await loadSalespersons()

        Swal.fire({
          title: "Success!",
          text: "Salesperson added successfully",
          icon: "success",
          confirmButtonColor: "#8b5cf6",
        })
      }
    } catch (error) {
      console.error("Error saving salesperson:", error)
      Swal.fire({
        title: "Error!",
        text: `Failed to save salesperson: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
    } finally {
      setLoading(false)
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
      {/* Loading Overlay */}
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
        >
          <div className="text-center text-white">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div>Loading salespersons...</div>
          </div>
        </div>
      )}

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
          <button className="btn btn-primary btn-lg" onClick={handleAddSalesperson} disabled={loading}>
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
