export default function DelhiMetroLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 bg-red-500 rounded-full" />
        <div className="absolute inset-2 bg-white rounded-full" />
        <div className="absolute inset-4 bg-red-500 rounded-full" />
      </div>
      <span className="text-xl font-bold text-white">FluxNav</span>
    </div>
  );
}