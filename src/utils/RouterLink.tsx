

import React from "react";
import { NavLink } from "react-router-dom";
import type { NavLinkProps } from "react-router-dom";

const RouterLink = React.forwardRef<HTMLAnchorElement, Omit<NavLinkProps, "ref">>(
  function RouterLink(props, ref) {
    return <NavLink ref={ref} {...props} />;
  }
);

export default RouterLink;
