import { cn, getTechLogos } from '@/lib/utils'
import Image from 'next/image'
import React from 'react'

const DisplayTechIcons = async ( {techStack}: TechIconProps ) => {
  const techIcons = await getTechLogos(techStack);
  return (
    <div className='flex flex-row'>
      {techIcons.slice(0, 3).map(({ tech, url }, index) => (
        <div 
          key={tech} 
          className={cn(
            'relative group bg-gray-200 rounded-full p-1.5 flex-center', 
            index >= 1 && '-ml-2'
            )}
        >
          <span className='tech-tooltip'>{tech}</span>
          <Image 
            src={url} 
            alt={tech} 
            width={100} 
            height={100} 
            className='size-4' 
          />
        </div>
      ))}
    </div>
  );
};

export default DisplayTechIcons