'use client';

import React from 'react';
import ColorIndicator from "@/components/atoms/data/ColorIndicator";
import Label from "@/components/atoms/display/Label";

 export default function BarLegend({ items }: { items: { label: string; color: string }[] }) {
 return (
 <div className="flex space-x-4 mx-4">
 {items.map((item) => (
 <div key={item.label} className="flex items-center">
 <ColorIndicator color={item.color} />
 <Label>{item.label}</Label>
 </div>
 ))}
 </div>
 );
 }


