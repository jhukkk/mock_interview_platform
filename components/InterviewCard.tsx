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
    userId, // This is the owner of the interview
    role, 
    type, 
    techstack, 
    createdAt,
    originalInterviewId,
    currentUserId, // Optional - can be passed from parent to override
 }: InterviewCardProps) => {
    // Get the current user if currentUserId wasn't provided
    const user = currentUserId ? { id: currentUserId } : await getCurrentUser();
    
    // Use current user's ID for feedback lookup, not the interview owner's ID
    const userIdForFeedback = user?.id || userId;
    
    // Try to get feedback for this interview ID
    let feedback = userIdForFeedback && id ? await getFeedbackByInterviewId({ interviewId: id, userId: userIdForFeedback }) : null;
    
    // If no feedback found and this is a copied interview, try the original interview ID
    if (!feedback && userIdForFeedback && originalInterviewId) {
        feedback = await getFeedbackByInterviewId({ interviewId: originalInterviewId, userId: userIdForFeedback });
    }
    
    const normalizedType = /mix/gi.test(type) ? 'Mixed' : type;
    const formattedDate = dayjs(feedback?.createdAt || createdAt || Date.now()).format('MMM D, YYYY');
    
    // Determine if this is the current user's own interview (they created it or took it)
    const isUserOwnInterview = user?.id === userId;
    
    return (
        <div className='card-border w-[320px] max-sm:w-full min-h-80'>
            <div className='card-interview py-5'>
                <div className='absolute top-0 right-0 w-fit px-5 py-2.5 rounded-bl-lg interview-type-badge'>
                    <p className='badge-text'>{normalizedType}</p>
                </div>
                <Image src={getRandomInterviewCover()} alt='cover image' width={70} height={70} className='rounded-full object-fit size-[70px]' />
                <h3 className='mt-3 capitalize'>
                    {role} Interview
                </h3>
                <div className='flex flex-row gap-4 mt-2'>
                    <div className='flex flex-row gap-2'>
                        <Image src="/calendar.svg" alt="calendar" width={20} height={20} />
                        <p>{formattedDate}</p>
                    </div>

                    <div className='flex flex-row gap-2 items-center'>
                        <Image src="/star.svg" alt="star" width={20} height={20} />
                        <p>{isUserOwnInterview && feedback?.totalScore !== undefined ? `${feedback.totalScore}/100` : '---/100'}</p>
                    </div>
                </div>
                <p className='line-clamp-2 mt-3'>
                    {isUserOwnInterview && feedback !== null && feedback.finalAssessment 
                        ? feedback.finalAssessment 
                        : "Take this interview to practice and improve your skills."}
                </p>
            </div>

            <div className='flex flex-row justify-between items-center px-4 py-3'>
                <DisplayTechIcons techStack={techstack} />
                <Button className='btn-primary'>
                    <Link href={feedback !== null && isUserOwnInterview ? `/interview/${id}/feedback` : `/interview/${id}`}>
                        {feedback !== null && isUserOwnInterview ? "Check feedback" : "View Interview"}
                    </Link>
                </Button>
            </div>
        </div>
    )
}

export default InterviewCard