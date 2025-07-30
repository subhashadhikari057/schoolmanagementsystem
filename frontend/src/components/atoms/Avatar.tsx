import React from 'react'
import Image from 'next/image'

export default function Avatar({src,className}:{src: string,className?: string}) {
  return (
    <div className={className}>
        <Image src={src} height={100} width={100} alt="User"/>
    </div>
  );
}
