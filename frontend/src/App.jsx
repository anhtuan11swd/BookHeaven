import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import AllBooks from "./pages/AllBooks";
import Cart from "./pages/Cart";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Signup from "./pages/Signup";
import ViewBookDetails from "./pages/ViewBookDetails";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-zinc-900 text-white">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route element={<Home />} path="/" />
            <Route element={<AllBooks />} path="/all-books" />
            <Route
              element={<ViewBookDetails />}
              path="/view-book-details/:id"
            />
            <Route element={<Login />} path="/login" />
            <Route element={<Signup />} path="/signup" />
            <Route element={<Cart />} path="/cart" />
            <Route element={<Profile />} path="/profile" />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
