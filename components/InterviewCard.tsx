import React from 'react'
import dayjs from 'dayjs'
import { getRandomInterviewCover } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';
import DisplayTechIcons from './DisplayTechIcons';
import { getFeedbackByInterviewId } from '@/lib/actions/general.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

const InterviewCard = async ({ 
    id, 
    role, 
    type, 
    techstack, 
    createdAt,
    currentUserId, // Optional - can be passed from parent
    section = "available" // Either "available" or "taken"
 }: InterviewCardProps) => {
    // Get the current user if currentUserId wasn't provided
    const user = currentUserId ? { id: currentUserId } : await getCurrentUser();
    
    // Get feedback for this interview if the current user has taken it
    let feedback = null;
    try {
        if (user?.id && id) {
            feedback = await getFeedbackByInterviewId({ 
                interviewId: id, 
                userId: user.id 
            });
        }
    } catch (error) {
        console.error("Error fetching feedback:", error);
    }
    
    const normalizedType = /mix/gi.test(type || '') ? 'Mixed' : type;
    const formattedDate = dayjs(feedback?.createdAt || createdAt || new Date()).format('MMM D, YYYY');
    
    // Determine if the user has taken this interview (has feedback)
    const hasTaken = feedback !== null;
    
    // Determine button text and link based on context
    let buttonText = "View Interview";
    let buttonLink = `/interview/${id}`;
    
    if (section === "taken" && hasTaken) {
        buttonText = "Check Feedback";
        buttonLink = `/interview/${id}/feedback`;
    }
    
    return (
        <div className='card-border w-[320px] max-sm:w-full min-h-80'>
            <div className='card-interview py-5'>
                <div className='absolute top-0 right-0 w-fit px-5 py-2.5 rounded-bl-lg interview-type-badge'>
                    <p className='badge-text'>{normalizedType || 'Interview'}</p>
                </div>
                <Image src={getRandomInterviewCover()} alt='cover image' width={70} height={70} className='rounded-full object-fit size-[70px]' />
                <h3 className='mt-3 capitalize'>
                    {role || 'General'} Interview
                </h3>
                <div className='flex flex-row gap-4 mt-2'>
                    <div className='flex flex-row gap-2'>
                        <Image src="/calendar.svg" alt="calendar" width={20} height={20} />
                        <p>{formattedDate}</p>
                    </div>

                    <div className='flex flex-row gap-2 items-center'>
                        <Image src="/star.svg" alt="star" width={20} height={20} />
                        <p>{hasTaken && feedback && (feedback.totalScore !== undefined) ? `${feedback.totalScore}/100` : '---/100'}</p>
                    </div>
                </div>
                <p className='line-clamp-2 mt-3'>
                    {hasTaken && feedback && feedback.finalAssessment 
                        ? feedback.finalAssessment 
                        : "Take this interview to practice and improve your skills."}
                </p>
            </div>

            <div className='flex flex-row justify-between items-center px-4 py-3'>
                <DisplayTechIcons techStack={techstack || []} />
                <Button className='btn-primary'>
                    <Link href={buttonLink}>
                        {buttonText}
                    </Link>
                </Button>
            </div>
        </div>
    )
}

export default InterviewCard