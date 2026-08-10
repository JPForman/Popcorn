import { Outlet } from "react-router-dom";
import { Header } from "./components/layout/Header";

export function App() {
  return (
    <>
      <a href="#main-content" className="skipLink">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
    </>
  );
}
