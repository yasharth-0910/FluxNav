import DelhiMetroLogo from "@/components/DelhiMetroLogo"

export function Header() {
  return (
    <header className="w-full z-30 py-4 px-6 flex items-center justify-between bg-transparent absolute top-0 left-0">
      <div className="flex items-center gap-3">
        <DelhiMetroLogo />
        <div>
          <div className="font-bold text-lg text-white">AI-powered Delhi Metro</div>
          <div className="text-xs text-white/60 -mt-1">Route Navigator</div>
        </div>
      </div>
      <nav className="hidden md:flex gap-6 text-white/80 font-medium">
        {["Explore", "Routes", "Stations", "Fares", "Help"].map(link => (
          <a key={link} href="#" className="hover:text-white transition">{link}</a>
        ))}
      </nav>
    </header>
  )
}