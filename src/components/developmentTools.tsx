import React from "react";
import { isDevelopment } from "../utils";

export const ReactHookFormDevelopmentTools = !isDevelopment
  ? (): null => null
  : React.lazy(() =>
      import("@hookform/devtools").then((result) => ({
        default: result.DevTool,
      }))
    );

export const TanStackRouterDevelopmentTools = (): null => null;

export const TanStackReactQueryDevelopmentTools = !isDevelopment
  ? (): null => null
  : React.lazy(() =>
      import("@tanstack/react-query-devtools").then((result) => ({
        default: result.ReactQueryDevtools,
      }))
    );
