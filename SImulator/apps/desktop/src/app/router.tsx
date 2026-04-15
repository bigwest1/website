import { Suspense, lazy } from "react";
import { createHashRouter, Outlet, RouterProvider } from "react-router-dom";

import { moduleDefinitions } from "@course-creator-os/project-model";

import { AppShell } from "./shell";

const HomeScreen = lazy(async () => ({
  default: (await import("../features/home/HomeScreen")).HomeScreen
}));
const WorkspaceScreen = lazy(async () => ({
  default: (await import("../features/workspace/WorkspaceScreen")).WorkspaceScreen
}));

function RouteLoadingScreen({ label }: { label: string }) {
  return (
    <section className="panel">
      <p className="eyebrow">Loading</p>
      <h2>{label}</h2>
      <p className="body-copy">
        Preparing the next workspace so the shell can keep the initial route lighter and more
        responsive.
      </p>
    </section>
  );
}

const workspaceRoutes = moduleDefinitions
  .filter((definition) => definition.key !== "home")
  .map((definition) => ({
    path: definition.route,
    element: (
      <Suspense fallback={<RouteLoadingScreen label={definition.title} />}>
        <WorkspaceScreen moduleKey={definition.key} />
      </Suspense>
    )
  }));

const router = createHashRouter([
  {
    path: "/",
    element: (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteLoadingScreen label="Home" />}>
            <HomeScreen />
          </Suspense>
        )
      },
      ...workspaceRoutes
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
