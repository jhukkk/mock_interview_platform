import { cn, getTechLogos } from '@/lib/utils'
import React from 'react'

const DisplayTechIcons = async ({ techStack }: TechIconProps) => {
  // Get the actual tech icons data
  const techIcons = await getTechLogos(techStack);
  
  // For debugging: Log what technologies are being requested
  console.log("Tech Stack Requested:", techStack);
  console.log("Tech Icons Generated:", JSON.stringify(techIcons));
  
  return (
    <div className='flex flex-row'>
      {/* Display the first 3 tech icons */}
      {techIcons.slice(0, 3).map(({ tech, url }, index) => (
        <div 
          key={tech} 
          className={cn(
            'relative group bg-amber-100 rounded-full p-2 flex items-center justify-center border border-amber-200', 
            index >= 1 && '-ml-3'
          )}
          title={tech}
        >
          <span className='tech-tooltip'>{tech}</span>
          {/* Use the fallback mechanism for each tech */}
          <object 
            type="image/svg+xml"
            data={url} 
            width="24" 
            height="24"
            className="pointer-events-none"
          >
            <img 
              src="/tech.svg" 
              alt={tech} 
              width="24" 
              height="24"
            />
          </object>
        </div>
      ))}
    </div>
  );
};

export default DisplayTechIcons