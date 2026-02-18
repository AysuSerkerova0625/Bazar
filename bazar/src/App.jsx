import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Link,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

import Login from "./pages/Login";
import Products from "./pages/Products";
import Today from "./pages/Today";
import Analysis from "./pages/Analysis";

import az from "./i18n/az";

function Shell({ onLogout, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo -> Today */}
          <Link to="/today" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              B
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                {az.app.name}
              </div>
              <div className="text-xs text-slate-500 -mt-0.5">
                {az.app.tagline}
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {[
              { to: "/today", label: az.nav.today },
              { to: "/products", label: az.nav.products },
              { to: "/analysis", label: az.nav.analysis },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-sky-500 text-slate-950"
                      : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <button
              onClick={onLogout}
              className="ml-2 inline-flex items-center rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-semibold hover:bg-slate-800 transition"
            >
              {az.nav.logout}
            </button>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="max-w-5xl mx-auto px-4 py-10 text-center text-sm text-slate-500">
        {az.app.footer}
      </footer>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        setSession(sess);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-slate-600">{az.app.loading}</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route
          path="/login"
          element={session ? <Navigate to="/today" replace /> : <Login />}
        />

        {/* Root -> Today */}
        <Route path="/" element={<Navigate to="/today" replace />} />

        {/* Today */}
        <Route
          path="/today"
          element={
            session ? (
              <Shell onLogout={logout}>
                <Today />
              </Shell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Products */}
        <Route
          path="/products"
          element={
            session ? (
              <Shell onLogout={logout}>
                <Products />
              </Shell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Analysis */}
        <Route
          path="/analysis"
          element={
            session ? (
              <Shell onLogout={logout}>
                <Analysis />
              </Shell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={
            session ? (
              <Navigate to="/today" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
