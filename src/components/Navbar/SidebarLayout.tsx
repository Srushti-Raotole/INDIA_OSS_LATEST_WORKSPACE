// SidebarLayout.tsx
import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { SidebarNav } from './SidebarNav';
import Navbar from './Navbar'; // Your existing Top Bar

const SidebarLayout = () => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Side Strip */}
      <SidebarNav open={open} />
      
      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Pass toggle function to your existing Navbar */}
        <Navbar onToggle={() => setOpen(!open)} />
        
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};