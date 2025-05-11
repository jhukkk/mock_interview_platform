import { getCurrentUser } from '@/lib/actions/auth.action';
import { getFeedbackByInterviewId, getInterviewById } from '@/lib/actions/general.action';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import React from 'react'
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const page = async ({ params }: RouteParams) => {
    const { id } = await params;
    const user = await getCurrentUser();

    const interview = await getInterviewById(id);
    if (!interview) redirect("/");

    // Try to get feedback for this interview ID
    let feedback = user?.id ? await getFeedbackByInterviewId({
      interviewId: id,
      userId: user.id,
    }) : null;
    
    // If no feedback found and this is a copied interview, try the original interview ID
    if (!feedback && interview.originalInterviewId && user?.id) {
      feedback = await getFeedbackByInterviewId({
        interviewId: interview.originalInterviewId,
        userId: user.id,
      });
    }

    console.log(feedback);
    return (
      <section className='section-feedback'>
        <div className='flex flex-row justify-center'>
          <h1 className='text-4xl font-semibold'>
            Feedback on the Interview -{" "}
            <span className='capitalize'>{interview.role}</span> Interview
          </h1>
        </div>

        <div className='flex flex-row justify-center'>
          <div className='flex flex-row gap-5'>
            <div className='flex flex-row gap-2'>
              <Image src="/star.svg" alt="star" width={22} height={22} />
              <p>
                Overall Impression:{" "}
                <span className='text-primary-200 font-bold'>
                  {feedback?.totalScore}
                </span>
                /100
              </p>
            </div>

            <div className='flex flex-row gap-2'>
              <Image src="/calendar.svg" alt="calendar" width={22} height={22} />
              <p>
                {feedback?.createdAt ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A") : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <hr />

        <p>{feedback?.finalAssessment}</p>

        <div className='flex flex-col gap-4'>
          <h2>Breakdown of the Interview:</h2>
          {feedback?.categoryScores?.map((category, index) => (
            <div key={index}>
              <p className='font-bold'>
                {index + 1}. {category.name} ({category.score}/100)
              </p>
              <p>
                {category.comment}
              </p>
            </div>
          ))}
        </div>

        <div className='flex flex-col gap-3'>
          <h3>Strengths</h3>
          <ul>
            {feedback?.strengths?.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>

        <div className='flex flex-col gap-3'>
          <h3>Areas for Improvement</h3>
          <ul>
            {feedback?.areasForImprovement?.map((area, index) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </div>

        <div className='buttons'>
          <Button className='flex-1 py-2.5 px-6 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg'>
            <Link href="/" className='flex w-full justify-center items-center gap-2'>
              <Image src="/home.svg" alt="home" width={18} height={18} /> 
              <p className='text-sm font-bold text-gray-800 text-center'>
                Back to dashboard
              </p>
            </Link>
          </Button>

          <Button className="btn-primary flex-1 py-2.5 px-6">
            <Link href={`/interview/${id}`} className="flex w-full justify-center items-center gap-2">
              <Image src="/ai-avatar.png" alt="AI" width={22} height={22} />
              <p className="text-sm font-bold text-white text-center">
                Retake Interview
              </p>
            </Link>
          </Button>
        </div>
      </section>
    )
}

export default page