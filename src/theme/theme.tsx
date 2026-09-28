import { createTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material";
import { useMemo } from "react";
import { useAppSelector } from "../utils/customHooks/reactDataHooks";

export const useReduxTheme = (): Theme => {
  const mode = useAppSelector((state) => state.theme.mode);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#37474f", 
            contrastText: "#eceff1", 
          },
          secondary: {
            main: "#ffcccb", 
            contrastText: "#000000",
          },
          ...(mode === "light"
            ? {
                background: {
                  default: "#fefefe",
                  paper: "#ffffff",
                },
                text: {
                  primary: "#000000",
                  secondary: "#333333",
                },
              }
            : {
                background: {
                  default: "#121212",
                  paper: "#1e1e1e",
                },
                text: {
                  primary: "#ffffff",
                  secondary: "#cccccc",
                },
              }),
        },
        typography: {
          fontFamily: "Roboto, sans-serif",
          h1: { fontSize: "2.2rem" },
          h2: { fontSize: "2rem" },
        },
        spacing: 8,
      }),
    [mode]
  );

  return theme;
};

