import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-5xl font-bold mb-6">2b2t Store</h1>
      <p className="text-xl text-gray-400 mb-8">
        Kits, consumables, and rare items delivered by bot. Pay with Monero.
      </p>
      <Link
        to="/shop"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg"
      >
        Browse Shop
      </Link>
    </div>
  )
}

export default Home
