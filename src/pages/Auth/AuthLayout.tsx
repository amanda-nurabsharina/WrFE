import { Outlet } from "@tanstack/react-router";
import officeImage from "../../assets/modern_office_workspace.png";

export function AuthLayout() {
  return (
    <main className="min-h-screen w-full bg-white dark:bg-zinc-950 flex items-center justify-center p-0 lg:p-6">
      <div className="w-full min-h-screen lg:min-h-[calc(100vh-3rem)] lg:grid lg:grid-cols-12 gap-8 bg-white dark:bg-zinc-950">
        
        {/* Left Column: Image Container (col-span-6) */}
        <div 
          className="hidden lg:block lg:col-span-6 relative overflow-hidden bg-zinc-950 shadow-2xl"
          style={{ 
            clipPath: 'polygon(0 80px, 80px 80px, 80px 0, 100% 0, 100% calc(100% - 80px), calc(100% - 80px) calc(100% - 80px), calc(100% - 80px) 100%, 0 100%)',
            borderRadius: '3rem'
          }}
        >
          {/* Background image inside clipped parent */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-85 hover:scale-105 transition-all duration-700"
            style={{ 
              backgroundImage: `url(${officeImage})`
            }}
          />
          {/* Overlay content inside clipped parent */}
          <div className="absolute inset-0 flex flex-col justify-end p-16 text-white">
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent -z-10" />
            
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
              Integrated Warehouse
              <br />
              Management.
            </h2>
            <p className="text-zinc-200 text-sm mt-4 max-w-sm font-medium leading-relaxed">
              Streamline your inventory, storage, and order tracking in one secure platform.
            </p>
          </div>
        </div>

        {/* Right Column: Form Container (col-span-6) */}
        <div className="col-span-12 lg:col-span-6 flex items-center justify-center py-12 px-6 sm:px-12 xl:px-24">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
