import { createHashRouter } from "react-router";
import Home from "./pages/Home";
import Planner from "./pages/Planner";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";

export const router = createHashRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/planner",
    Component: Planner,
  },
  {
    path: "/results",
    Component: Results,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
