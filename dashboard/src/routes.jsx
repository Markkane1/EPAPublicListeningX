import React from "react";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";

export const allRoutes = [
  {
    type: "route",
    name: "Dashboard Overview",
    key: "dashboard",
    route: "/dashboard",
    permission: "dashboard.view",
    icon: <DashboardRoundedIcon sx={{ fontSize: "17px", color: "inherit" }} />,
  },
  {
    type: "route",
    name: "Keyword Search & Fetch",
    key: "search",
    route: "/search",
    permission: "posts.view",
    icon: <TravelExploreRoundedIcon sx={{ fontSize: "17px", color: "inherit" }} />,
  },
  {
    type: "route",
    name: "Posts Feed (Full Previews)",
    key: "posts",
    route: "/posts",
    permission: "posts.view",
    icon: <FormatListBulletedRoundedIcon sx={{ fontSize: "17px", color: "inherit" }} />,
  },
  {
    type: "route",
    name: "Analytics & Charts",
    key: "analytics",
    route: "/analytics",
    permission: "analytics.view",
    icon: <BarChartRoundedIcon sx={{ fontSize: "17px", color: "inherit" }} />,
  },
  {
    type: "route",
    name: "Deduplication Audit",
    key: "audit",
    route: "/audit",
    permission: "audit.view",
    icon: <FactCheckRoundedIcon sx={{ fontSize: "17px", color: "inherit" }} />,
  },
  {
    type: "route",
    name: "Noise & Learning Engine",
    key: "noise",
    route: "/noise",
    permission: "noise.view",
    icon: <CleaningServicesRoundedIcon sx={{ fontSize: "17px", color: "inherit" }} />,
  },
  {
    type: "route",
    name: "User Management",
    key: "users",
    route: "/users",
    permission: "users.view",
    icon: <PeopleRoundedIcon sx={{ fontSize: "17px", color: "inherit" }} />,
  },
  {
    type: "route",
    name: "Role Policies",
    key: "roles",
    route: "/roles",
    permission: "roles.view",
    icon: <AdminPanelSettingsRoundedIcon sx={{ fontSize: "17px", color: "inherit" }} />,
  },
  {
    type: "route",
    name: "System Settings",
    key: "settings",
    route: "/settings",
    permission: "settings.view",
    icon: <TuneRoundedIcon sx={{ fontSize: "17px", color: "inherit" }} />,
  },
];

export const getRoutes = (user) => {
  if (!user) return [];

  if (user.role?.name === "super_admin") {
    return allRoutes;
  }

  const userPerms = user.permissions || [];
  return allRoutes.filter((r) => {
    if (!r.permission) return true;
    return userPerms.includes(r.permission);
  });
};

export default getRoutes;