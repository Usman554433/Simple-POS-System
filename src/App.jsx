"use client"

import { useState } from "react"
import ProductsComponent from "./components/ProductsComponent"
import SalespersonComponent from "./components/SalespersonComponent"
import PointOfSaleComponent from "./components/PointOfSaleComponent"
import "bootstrap/dist/css/bootstrap.min.css"
import "./App.css"
import SweetAlert2 from "sweetalert2"

// Make Swal available globally for convenience
window.Swal = SweetAlert2

function App() {
  const [activeTab, setActiveTab] = useState("pos")

  return (
    <div className="App">
      {/* Single Top Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark main-navbar">
        <div className="container-fluid">
          <span className="navbar-brand">
            <i className="fas fa-cash-register me-2"></i>
            POS System
          </span>

          <div className="navbar-nav ms-auto">
            <button
              className={`nav-link btn btn-link me-3 ${activeTab === "pos" ? "active" : ""}`}
              onClick={() => setActiveTab("pos")}
            >
              <i className="fas fa-shopping-cart me-1"></i>
              Point of Sale
            </button>
            <button
              className={`nav-link btn btn-link me-3 ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              <i className="fas fa-box me-1"></i>
              Products
            </button>
            <button
              className={`nav-link btn btn-link ${activeTab === "salesperson" ? "active" : ""}`}
              onClick={() => setActiveTab("salesperson")}
            >
              <i className="fas fa-user-tie me-1"></i>
              Salesperson
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="main-content">
        {activeTab === "pos" && <PointOfSaleComponent />}
        {activeTab === "products" && (
          <div className="content-wrapper">
            <ProductsComponent />
          </div>
        )}
        {activeTab === "salesperson" && (
          <div className="content-wrapper">
            <SalespersonComponent />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
