import * as XLSX from "xlsx";
 
export const exportToExcel = (data: Record<string, any>[], fileName: string) => {
  if (!data || data.length === 0) {
    alert("No data available to export!");
    return;
  }
 
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
 
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Error exporting Excel:", error);
    alert("Failed to export Excel file!");
  }
};
 
 