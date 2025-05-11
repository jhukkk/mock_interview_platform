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
            'relative group bg-gray-200 rounded-full p-1.5 flex items-center justify-center', 
            index >= 1 && '-ml-2'
          )}
          title={tech}
        >
          <span className='tech-tooltip'>{tech}</span>
          {/* Use the fallback mechanism for each tech */}
          <object 
            type="image/svg+xml"
            data={url} 
            width="16" 
            height="16"
            className="pointer-events-none"
          >
            <img 
              src="/tech.svg" 
              alt={tech} 
              width="16" 
              height="16"
            />
          </object>
        </div>
      ))}
    </div>
  );
};

export default DisplayTechIcons