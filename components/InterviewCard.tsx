import React from 'react'
import dayjs from 'dayjs'
import { getRandomInterviewCover } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';
import DisplayTechIcons from './DisplayTechIcons';
import { getFeedbackByInterviewId } from '@/lib/actions/general.action';

const InterviewCard = async ({ 
    id, 
    userId, 
    role, 
    type, 
    techstack, 
    createdAt,
 }: InterviewCardProps) => {
    const feedback = userId && id ? await getFeedbackByInterviewId({ interviewId: id, userId }) : null;
    const normalizedType = /mix/gi.test(type) ? 'Mixed' : type;
    const formattedDate = dayjs(feedback?.createdAt || createdAt || Date.now()).format('MMM D, YYYY');
    return (
        <div className='card-border w-[360px] max-sm:w-full min-h-80'>
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
                        <p>{feedback?.totalScore || '---'}/100</p>
                    </div>
                </div>
                <p className='line-clamp-2 mt-3'>
                    {feedback?.finalAssessment || "You haven't taken the interview yet. Take it now to improve your skills."}
                </p>
            </div>

            <div className='flex flex-row justify-between items-center px-4 py-3'>
                <DisplayTechIcons techStack={techstack} />
                <Button className='btn-primary'>
                    <Link href={feedback? `/interview/${id}/feedback` : `/interview/${id}`}>
                        {feedback? "Check feedback" : "View Interview"}
                    </Link>
                </Button>
            </div>
        </div>
    )
}

export default InterviewCard