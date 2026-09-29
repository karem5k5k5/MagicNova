import { useNavigate } from "react-router-dom"
import { ArrowRight, LayoutDashboard, WandSparkles } from "lucide-react"
import { useAppContext } from '../context/AppContext'

const Navbar = () => {
  const navigate = useNavigate()
  const { user } = useAppContext()

  return (
    <nav className="fixed w-full z-5 backdrop-blur-2xl flex justify-between items-center py-3 px-4 sm:px-20 xl:px-32">
      <h2
        className="flex items-center gap-2 text-primary md:text-4xl text-2xl font-bold cursor-pointer"
        onClick={() => { navigate('/'); window.scrollTo(0, 0) }}
      >
        MagicNova <WandSparkles className="md:w-9 md:h-9 w-6 h-6 text-primary" />
      </h2>

      {user ? (
        <button
          onClick={() => navigate('/ai')}
          className="flex items-center gap-2 rounded-full text-sm cursor-pointer text-white bg-primary px-6 py-2.5"
        >
          Dashboard <LayoutDashboard className="w-4 h-4" />
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-600 hover:text-primary transition cursor-pointer px-4 py-2"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 rounded-full text-sm cursor-pointer text-white bg-primary px-6 py-2.5"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </nav>
  )
}

export default Navbar
