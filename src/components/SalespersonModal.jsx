"use client"

import { useState, useEffect } from "react"

const SalespersonModal = ({ show, onHide, salesperson, onSave }) => {
  const [formData, setFormData] = useState({
    Name: "",
    Code: "",
  })

  useEffect(() => {
    if (salesperson) {
      setFormData({
        Name: salesperson.Name || "",
        Code: salesperson.Code || "",
      })
    } else {
      setFormData({
        Name: "",
        Code: "",
      })
    }
  }, [salesperson, show])

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && show) {
        onHide()
      }
    }

    if (show) {
      document.addEventListener("keydown", handleKeyDown)
      // Focus the modal when it opens
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [show, onHide])

  const checkSalespersonCodeExists = (code) => {
    const savedSalespersons = JSON.parse(localStorage.getItem("salespersons") || "[]")
    return savedSalespersons.some((s) => s.Code.toLowerCase() === code.toLowerCase())
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation for new salesperson - check if code already exists
    if (!salesperson && checkSalespersonCodeExists(formData.Code)) {
      window.Swal.fire({
        title: "Code Already Exists!",
        text: `Salesperson code "${formData.Code}" already exists. Please use a different code.`,
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
      return
    }

    onSave(formData)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (!show) return null

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{salesperson ? "Edit Salesperson" : "Add New Salesperson"}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Salesperson Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="Name"
                  value={formData.Name}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Salesperson Code *
                  {salesperson && <small className="text-muted ms-2">(Code cannot be changed in edit mode)</small>}
                </label>
                <input
                  type="text"
                  className={`form-control ${salesperson ? "bg-light" : ""}`}
                  name="Code"
                  value={formData.Code}
                  onChange={handleChange}
                  required
                  readOnly={!!salesperson} // Make read-only in edit mode
                  disabled={!!salesperson} // Disable in edit mode
                  style={salesperson ? { cursor: "not-allowed" } : {}}
                />
                {salesperson && (
                  <small className="text-info">
                    <i className="fas fa-lock me-1"></i>
                    Salesperson code is locked for existing salespersons
                  </small>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {salesperson ? "Update Salesperson" : "Add Salesperson"}
              </button>
            </div>
          </form>

          {/* ESC key hint */}
          <div className="position-absolute" style={{ bottom: "10px", left: "20px" }}>
            <small className="text-muted">
              <i className="fas fa-keyboard me-1"></i>
              Press ESC to close
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalespersonModal
