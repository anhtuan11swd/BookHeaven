import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import AllBooks from "./pages/AllBooks";
import Cart from "./pages/Cart";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Signup from "./pages/Signup";
import ViewBookDetails from "./pages/ViewBookDetails";
import { authActions } from "./store/auth.js";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const id = window.localStorage.getItem("id");
    const token = window.localStorage.getItem("token");
    const role = window.localStorage.getItem("role");

    if (id && token) {
      dispatch(authActions.login());
      dispatch(authActions.changeRole(role || "user"));
    }
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-900 text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route element={<Home />} path="/" />
          <Route element={<AllBooks />} path="/all-books" />
          <Route element={<ViewBookDetails />} path="/view-book-details/:id" />
          <Route element={<Login />} path="/login" />
          <Route element={<Signup />} path="/signup" />
          <Route element={<Cart />} path="/cart" />
          <Route element={<Profile />} path="/profile" />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
