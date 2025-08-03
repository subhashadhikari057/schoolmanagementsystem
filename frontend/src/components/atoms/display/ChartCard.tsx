 export default function ChartCard({ children ,className}: { children: React.ReactNode , className?: string }) {
 return <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>;
 }


