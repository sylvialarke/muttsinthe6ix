import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import CheckInProgress from "@/components/CheckInProgress";

interface CheckInLayoutProps {
  children: ReactNode;
  step?: 0 | 1 | 2;
  title: string;
  subtitle?: string;
  showProgress?: boolean;
  totalSteps?: 2;
}

const CheckInLayout = ({
  children,
  step = 1,
  title,
  subtitle,
  showProgress = true,
  totalSteps = 2,
}: CheckInLayoutProps) => {
  return (
    <div
      className="min-h-screen flex flex-col items-center font-['Inter'] relative overflow-hidden"
      style={{ background: "#f0e9df" }}
    >
      {/* Collage background */}
      <div className="absolute inset-0 z-0">
        {/* Top-left — dogs at ski resort, zoomed out to show horizon */}
        <div style={{
          position: "absolute", top: "2%", left: "-8%", width: "44%", height: "56%",
          backgroundImage: "url('/dogs-ski.png')", backgroundSize: "contain",
          backgroundPosition: "center top", backgroundRepeat: "no-repeat",
          backgroundColor: "#f0e9df",
          transform: "rotate(-5deg)", border: "10px solid white",
          boxShadow: "4px 8px 20px rgba(0,0,0,0.18)",
        }} />
        {/* Top-right — pint/people drinking (swapped from bottom-left) */}
        <div style={{
          position: "absolute", top: "2%", right: "-6%", width: "46%", height: "52%",
          backgroundImage: "url('/pint-bg.png')", backgroundSize: "contain",
          backgroundPosition: "center center", backgroundRepeat: "no-repeat",
          backgroundColor: "#f0e9df",
          transform: "rotate(4deg)", border: "10px solid white",
          boxShadow: "4px 8px 20px rgba(0,0,0,0.18)",
        }} />
        {/* Bottom-left — ski girls (swapped from top-right) */}
        <div style={{
          position: "absolute", bottom: "-6%", left: "0%", width: "42%", height: "50%",
          backgroundImage: "url('/ski-girls-new.png')", backgroundSize: "contain",
          backgroundPosition: "center center", backgroundRepeat: "no-repeat",
          backgroundColor: "#f0e9df",
          transform: "rotate(3deg)", border: "10px solid white",
          boxShadow: "4px 8px 20px rgba(0,0,0,0.18)",
        }} />
        {/* Bottom-right — gondola scene */}
        <div style={{
          position: "absolute", bottom: "-4%", right: "-4%", width: "44%", height: "50%",
          backgroundImage: "url('/chalet-bg.png')", backgroundSize: "contain",
          backgroundPosition: "center center", backgroundRepeat: "no-repeat",
          backgroundColor: "#f0e9df",
          transform: "rotate(-4deg)", border: "10px solid white",
          boxShadow: "4px 8px 20px rgba(0,0,0,0.18)",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(240, 233, 223, 0.55)" }} />
      </div>

      {/* Purple header — text only, no logo */}
      <div
        className="w-full flex items-center justify-center relative z-20 px-8"
        style={{
          background: "linear-gradient(160deg, #8C81BD 0%, #7366a8 70%, #9d8fc7 100%)",
          height: "88px",
          flexShrink: 0,
        }}
      >
        <p
          className="text-white text-3xl font-bold tracking-widest text-center uppercase"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
        >
          🐾 A MORE EXCITING DOG PARK AWAITS 🚡🥂
        </p>
      </div>

      {/* Form card */}
      <div
        className="w-full max-w-3xl mx-auto px-4 pt-0 pb-12 relative z-30"
        style={{ minHeight: "calc(100vh - 88px)" }}
      >
        <Card
          className="w-full border-none card-shadow rounded-b-xl rounded-t-none bg-white/90 backdrop-blur-sm"
        >
          {showProgress && step !== 0 && (
            <div className="px-8 pt-5">
              <CheckInProgress step={step} totalSteps={totalSteps} />
            </div>
          )}
          <div className="px-8 pb-4 space-y-4">
            <div className="space-y-1 text-center">
              <h1 className="text-5xl font-bold text-mutts-primary animate-fade-in">
                {title}
              </h1>
              {subtitle && <p className="text-2xl text-gray-600">{subtitle}</p>}
            </div>
            {children}
          </div>

          {/* Logo at bottom of form */}
          <div className="flex justify-center py-4">
            <img
              src="https://muttsinthe6ix.ca/assets/images/image01.png?v=e2c919dc"
              alt="Mutts in the 6ix"
              className="h-44 drop-shadow-lg opacity-90"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CheckInLayout;
