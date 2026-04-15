import "@fontsource/sora/400.css";
import "@fontsource/sora/500.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/jetbrains-mono/500.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { installCourseCreatorUiStyles } from "@course-creator-os/ui";

import { AppRouter } from "./app/router";
import { bootstrapProjectSession } from "./app/project-session";
import "./styles/index.css";

installCourseCreatorUiStyles();
bootstrapProjectSession();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Course Creator OS root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
