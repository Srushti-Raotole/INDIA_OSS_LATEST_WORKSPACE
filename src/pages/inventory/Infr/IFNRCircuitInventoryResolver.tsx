import React from "react";
import { useParams } from "react-router-dom";
import IFNRCircuitInventory from "./Reports/IFNRCircuitInventory";

export default function IFNRCircuitInventoryResolver() {
  const { client } = useParams<{ client: string }>();

  if (!client) {
    return <div>Client not found</div>;
  }


  return <IFNRCircuitInventory />;
}
