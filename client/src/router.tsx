import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "./App";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { SearchPage } from "./pages/SearchPage";
import { PeoplePage } from "./pages/PeoplePage";
import { TitleDetailPage } from "./pages/TitleDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { TimelinePage } from "./pages/TimelinePage";
import { FeedPage } from "./pages/FeedPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Navigate to="/search" replace /> },
          { path: "search", element: <SearchPage /> },
          { path: "people", element: <PeoplePage /> },
          { path: "title/:type/:tmdbId", element: <TitleDetailPage /> },
          { path: "u/:userId", element: <ProfilePage /> },
          { path: "u/:userId/timeline", element: <TimelinePage /> },
          { path: "feed", element: <FeedPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
