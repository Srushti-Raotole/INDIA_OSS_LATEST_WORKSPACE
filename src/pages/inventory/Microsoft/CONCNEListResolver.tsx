import React from "react";
import { useParams } from "react-router-dom";
import CONCNEListReport from "./Reports/ConcNEList";

export default function CONCNEListResolver() {
  const { client } = useParams<{ client: string }>();

  if (!client) {
    return <div>Client not found</div>;
  }

  return <CONCNEListReport />;
}
