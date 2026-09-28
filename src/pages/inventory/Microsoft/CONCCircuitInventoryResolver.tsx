import React from "react";
import { useParams } from "react-router-dom";
import CONCCircuitInventory from "./Reports/ConcCircuitInventory";

export default function CONCCircuitInventoryResolver() {
  const { client } = useParams<{ client: string }>();

  if (!client) {
    return <div>Client not found</div>;
  }

  return <CONCCircuitInventory />;
}
