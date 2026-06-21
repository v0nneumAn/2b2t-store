import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Order from './pages/Order'

function App() {
  return (
    <div className="min-h-screen">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">2b2t Store</Link>
          <div className="space-x-4">
            <Link to="/shop" className="hover:text-gray-300">Shop</Link>
            <Link to="/cart" className="hover:text-gray-300">Cart</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<Order />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
