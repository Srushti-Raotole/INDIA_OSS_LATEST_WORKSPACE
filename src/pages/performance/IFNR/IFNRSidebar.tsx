import { NavLink } from "react-router-dom";

export default function IFNRSidebar({ data }: { data: any }) {
  return (
    <div>
      <div className="sidebar-title">IFNR</div>

      {data.clients.map((client: any) => (
        <div key={client.client}>
          <div className="font-semibold">{client.client}</div>

          {client.reports.map((report: any) => (
            <NavLink
              key={report.key}
              to={`/performance-report/ifnr/${encodeURIComponent(
                client.client
              )}/${report.key}`}
              className="sidebar-link"
            >
              {report.title}
            </NavLink>
          ))}
        </div>
      ))}
    </div>
  );
}
