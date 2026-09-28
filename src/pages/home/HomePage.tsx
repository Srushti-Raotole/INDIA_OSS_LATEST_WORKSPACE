import { Outlet } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { useEffect } from "react";
import Footer from "../../components/common/Footer";

function HomePage() {
  useEffect(() => {
    document.title = `INDIA OSS | NOC Portal`;
  }, []);
  return (
    <>
      <Navbar />
      <Outlet />

    </>
  );
}
export default HomePage;
