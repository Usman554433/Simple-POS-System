"use client"

const Navbar = ({ activeTab, setActiveTab }) => {
  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark"
      style={{ background: "linear-gradient(45deg, #667eea, #764ba2)" }}
    >
      <div className="container-fluid">
        <span className="navbar-brand">
          <i className="fas fa-cash-register me-2"></i>
          POS System
        </span>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link ${activeTab === "pos" ? "active" : ""}`}
                onClick={() => setActiveTab("pos")}
              >
                <i className="fas fa-shopping-cart me-1"></i>
                Point of Sale
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link ${activeTab === "products" ? "active" : ""}`}
                onClick={() => setActiveTab("products")}
              >
                <i className="fas fa-box me-1"></i>
                Products
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link ${activeTab === "salesperson" ? "active" : ""}`}
                onClick={() => setActiveTab("salesperson")}
              >
                <i className="fas fa-user-tie me-1"></i>
                Salesperson
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
