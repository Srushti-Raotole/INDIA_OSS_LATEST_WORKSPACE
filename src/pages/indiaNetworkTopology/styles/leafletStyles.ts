// ============================================
// Custom Leaflet Styles
// ============================================

export const leafletCustomStyles = `
  .marker-cluster {
    background-color: rgba(59, 130, 246, 0.3);
    border: 2px solid rgba(59, 130, 246, 0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .marker-cluster div {
    width: 30px;
    height: 30px;
    background-color: rgba(59, 130, 246, 0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .marker-cluster span {
    color: white;
    font-weight: bold;
    font-size: 12px;
  }
  .marker-cluster-small {
    background-color: rgba(34, 197, 94, 0.3);
    border-color: rgba(34, 197, 94, 0.8);
  }
  .marker-cluster-small div {
    background-color: rgba(34, 197, 94, 0.8);
  }
  .marker-cluster-medium {
    background-color: rgba(234, 179, 8, 0.3);
    border-color: rgba(234, 179, 8, 0.8);
  }
  .marker-cluster-medium div {
    background-color: rgba(234, 179, 8, 0.8);
  }
  .marker-cluster-large {
    background-color: rgba(239, 68, 68, 0.3);
    border-color: rgba(239, 68, 68, 0.8);
  }
  .marker-cluster-large div {
    background-color: rgba(239, 68, 68, 0.8);
  }
  .leaflet-container {
    background-color: hsl(var(--background));
  }
  /* Hide default zoom control (using custom MapZoomControl) */
  .leaflet-control-zoom {
    display: none !important;
  }
  /* Custom zoom control styling */
  .custom-zoom-control {
    margin-bottom: 10px !important;
    margin-right: 10px !important;
  }
  /* Fiber site markers */
  .fiber-site-marker {
    z-index: 500 !important;
  }
  .fiber-site-label {
    z-index: 501 !important;
  }
  /* Device labels */
  .device-label-marker {
    z-index: 502 !important;
  }
  /* Alarm pulse animation for critical sites */
  @keyframes alarm-pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  .alarm-pulse {
    animation: alarm-pulse 1.5s ease-in-out infinite;
  }
  /* Alarm glow effect — matches topology utility SVG glow */
  @keyframes alarm-glow-pulse {
    0%, 100% { opacity: 0.25; }
    50% { opacity: 0.05; }
  }
  .alarm-glow-line {
    animation: alarm-glow-pulse 2s ease-in-out infinite;
    filter: url(#alarm-glow-filter);
  }
  /* Blinking animation for alarmed routes */
  @keyframes alarm-blink {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 0.15; }
  }
  .alarm-blink-line {
    animation: alarm-blink 2s ease-in-out infinite;
  }
  /* Blinking animation for legend items */
  .alarm-blink-legend {
    animation: alarm-blink 2s ease-in-out infinite;
  }
`;
