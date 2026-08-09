import { createBrowserRouter } from "react-router-dom";
import { App } from "./App";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { SearchPage } from "./pages/SearchPage";
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
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "title/:type/:tmdbId", element: <TitleDetailPage /> },
      { path: "u/:userId", element: <ProfilePage /> },
      { path: "u/:userId/timeline", element: <TimelinePage /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: "feed", element: <FeedPage /> }],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
