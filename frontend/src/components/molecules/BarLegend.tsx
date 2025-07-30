 import ColorIndicator from "../atoms/ColorIndicator";
 import Label from "../atoms/Label";

 export default function BarLegend({ items }: { items: { label: string; color: string }[] }) {
 return (
 <div className="flex space-x-4 mt-2">
 {items.map((item) => (
 <div key={item.label} className="flex items-center">
 <ColorIndicator color={item.color} />
 <Label>{item.label}</Label>
 </div>
 ))}
 </div>
 );
 }