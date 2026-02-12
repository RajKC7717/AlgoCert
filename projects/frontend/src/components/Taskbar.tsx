import { Link } from "react-router-dom";
import "./Taskbar.css";

const Taskbar = () => {
  return (
    <div className="taskbar-container">
      <div className="taskbar">
        
        {/* State 1: Collapsed Indicator */}
        <div className="taskbar-indicator">
            {/* Simple CSS Arrow */}
            <div className="arrow-icon"></div>
        </div>

        {/* State 2: Expanded Menu */}
        <div className="taskbar-menu">
          <Link to="/" className="taskbar-link">
            HOME
          </Link>
          
          <div className="taskbar-divider"></div>
          
          <Link to="/dashboard" className="taskbar-link">
            DASHBOARD
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Taskbar;