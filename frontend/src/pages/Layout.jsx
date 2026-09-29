import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, X, WandSparkles } from 'lucide-react'
import Sidebar from './../components/Sidebar'
import { useAppContext } from '../context/AppContext'

const Layout = () => {
  const navigate = useNavigate()
  const { user } = useAppContext()
  const [sidebar, setSidebar] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [user, navigate])

  if (!user) return null

  return (
    <div className="flex flex-col items-start justify-start h-screen">
      <nav className="w-full px-8 min-h-14 flex items-center justify-between border-b border-gray-200">
        <h2
          className="flex items-center gap-2 text-primary md:text-4xl text-2xl font-bold cursor-pointer"
          onClick={() => { navigate('/'); window.scrollTo(0, 0) }}
        >
          MagicNova <WandSparkles className="md:w-9 md:h-9 w-6 h-6 text-primary" />
        </h2>
        {sidebar
          ? <X onClick={() => setSidebar(false)} className="cursor-pointer h-6 w-6 text-gray-600 sm:hidden" />
          : <Menu onClick={() => setSidebar(true)} className="cursor-pointer h-6 w-6 text-gray-600 sm:hidden" />
        }
      </nav>
      <div className="flex-1 w-full flex h-[calc(100vh-56px)]">
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <div className="flex-1 bg-[#f4f7fb] overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Layout
