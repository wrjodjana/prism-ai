import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route("dashboard/:owner/:repo", "routes/dashboard.tsx"), route("main", "routes/main.tsx")] satisfies RouteConfig;
