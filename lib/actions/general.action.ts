'use server';

import { feedbackSchema } from '@/constants';
import { db } from '@/firebase/admin';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
    try {
        const interviews = await db
            .collection("interviews")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();

        const interviewData = interviews.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Interview[];
        
        // Create a map to group interviews by their originalId or their own id if they're original
        const uniqueInterviews = new Map<string, Interview>();
        
        interviewData.forEach(interview => {
            // For interviews the user has taken (copies)
            if (interview.originalInterviewId) {
                // If we haven't seen this original interview yet, or this is newer than what we have
                if (!uniqueInterviews.has(interview.originalInterviewId) || 
                    new Date(interview.createdAt) > new Date(uniqueInterviews.get(interview.originalInterviewId)!.createdAt)) {
                    uniqueInterviews.set(interview.originalInterviewId, interview);
                }
            } 
            // For original interviews created by the user
            else {
                // If we haven't seen this interview yet
                if (!uniqueInterviews.has(interview.id)) {
                    uniqueInterviews.set(interview.id, interview);
                }
            }
        });
        
        // Convert the map values back to an array and sort by creation date (newest first)
        return Array.from(uniqueInterviews.values())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
    } catch (error) {
        console.error("Error getting user interviews:", error);
        return null;
    }
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    try {
        // If no user ID provided, just return a limited set of available interviews
        if (!userId) {
            const interviews = await db
                .collection("interviews")
                .orderBy("createdAt", "desc")
                .where("finalized", "==", true)
                .limit(limit * 2)
                .get();
                
            // Deduplicate interviews by questions similarity
            const uniqueInterviews = deduplicateInterviews(interviews.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }) as Interview));
            
            return uniqueInterviews.slice(0, limit);
        }

        // Get all interviews that this user has already taken (as copies)
        const userInterviews = await db
            .collection("interviews")
            .where("userId", "==", userId)
            .get();

        // Create a set of original interview IDs that the user has already taken
        const takenInterviewIds = new Set<string>();
        userInterviews.docs.forEach(doc => {
            const data = doc.data();
            if (data.originalInterviewId) {
                takenInterviewIds.add(data.originalInterviewId);
            }
        });
        
        // Get all interviews from other users that are available to take
        const interviews = await db
            .collection("interviews")
            .orderBy("createdAt", "desc")
            .where("finalized", "==", true)
            .where("userId", "!=", userId)
            .limit(limit * 3) // Fetch more to account for filtering
            .get();

        // Filter out interviews that the user has already taken, being careful to check IDs
        let availableInterviews = interviews.docs
            .filter(doc => {
                // Don't include if this exact interview is in the taken set
                return !takenInterviewIds.has(doc.id);
            })
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Interview[];
            
        // Additional filtering to catch any interviews with the same role/techstack
        // that might have been missed in the first filter
        const userInterviewsData = userInterviews.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Interview[];
        
        // Create a set of unique keys for interviews the user has already taken
        const takenInterviewKeys = new Set<string>();
        userInterviewsData.forEach(interview => {
            const key = `${interview.role.toLowerCase()}_${interview.techstack.sort().join('_')}`;
            takenInterviewKeys.add(key);
        });
        
        // Filter out interviews with the same role/techstack combination
        availableInterviews = availableInterviews.filter(interview => {
            const key = `${interview.role.toLowerCase()}_${interview.techstack.sort().join('_')}`;
            return !takenInterviewKeys.has(key);
        });
            
        // Deduplicate the available interviews to avoid showing similar templates
        availableInterviews = deduplicateInterviews(availableInterviews);
        
        return availableInterviews.slice(0, limit);
    } catch (error) {
        console.error("Error getting latest interviews:", error);
        return null;
    }
}

// Helper function to deduplicate interviews based on role and techstack
function deduplicateInterviews(interviews: Interview[]): Interview[] {
    // Use a map to track unique interviews by role + techstack combination
    const uniqueInterviews = new Map<string, Interview>();
    
    interviews.forEach(interview => {
        const key = `${interview.role.toLowerCase()}_${interview.techstack.sort().join('_')}`;
        
        // If we haven't seen this combination, or this interview is newer
        if (!uniqueInterviews.has(key) || 
            new Date(interview.createdAt) > new Date(uniqueInterviews.get(key)!.createdAt)) {
            uniqueInterviews.set(key, interview);
        }
    });
    
    // Convert the map values back to an array and sort by creation date (newest first)
    return Array.from(uniqueInterviews.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interviews = await db
        .collection("interviews")
        .doc(id)
        .get();

    return interviews.data() as Interview | null; 
}

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript } = params;

    try {
        const formattedTranscript = transcript
            .map((sentence: { role: string; content: string; }) => (
                `- ${sentence.role}: ${sentence.content}\n`
            )).join('');

        const { object: {totalScore, categoryScores, strengths, areasForImprovement, finalAssessment }} = await generateObject({
            model: google("gemini-2.0-flash-001", {
                structuredOutputs: false,
            }),
            schema: feedbackSchema,
            prompt: `You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out. If the candidate doesn't say anything, give 0.
            Transcript:
            ${formattedTranscript}
            
            Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided.
            - **Communication Skills**: Clarity, articulation, structured responses.
            - **Technical Knowledge**: Understanding of key concepts for the role.
            - **Problem-Solving**: Ability to analyze problems and propose solutions.
            - **Cultural & Role Fit**: Alignment with company values and job role.
            - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
            `,
            system: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
        });

        const feedback = await db
            .collection("feedback")
            .add({
                interviewId,
                userId,
                totalScore,
                categoryScores,
                strengths,
                areasForImprovement,
                finalAssessment,
                createdAt: new Date().toISOString()
            })

        return {
            success: true,
            feedbackId: feedback.id 
        }
    } catch (error) {
        console.error("Error saving feedback", error);
        return {  success: false }
    }
}

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    const feedback = await db
        .collection("feedback")
        .where("interviewId", "==", interviewId)
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

    if (feedback.empty) return null;

    const feedbackDoc = feedback.docs[0];

    return {
        id: feedbackDoc.id,
        ...feedbackDoc.data()
    } as Feedback;
}

export async function associateInterviewWithUser(params: {interviewId: string, userId: string}): Promise<{success: boolean, newInterviewId?: string}> {
    const { interviewId, userId } = params;
    
    try {
        // Get the original interview
        const interviewDoc = await db.collection("interviews").doc(interviewId).get();
        const interview = interviewDoc.data();
        
        if (!interview) return { success: false };
        
        // Check if this user already has this interview associated
        const existingUserInterviews = await db
            .collection("interviews")
            .where("userId", "==", userId)
            .where("originalInterviewId", "==", interviewId)
            .limit(1)
            .get();
            
        // If the user already has this interview, update its timestamp and return its ID
        if (!existingUserInterviews.empty) {
            const existingInterview = existingUserInterviews.docs[0];
            // Update the existing interview's timestamp to make it appear as the most recent
            await db.collection("interviews").doc(existingInterview.id).update({
                createdAt: new Date().toISOString()
            });
            
            return { 
                success: true, 
                newInterviewId: existingInterview.id 
            };
        }
        
        // Create a copy of the interview for this user
        const newInterviewRef = await db.collection("interviews").add({
            ...interview,
            userId: userId,
            originalInterviewId: interviewId, // Track the original interview
            createdAt: new Date().toISOString()
        });
        
        return { 
            success: true,
            newInterviewId: newInterviewRef.id
        };
    } catch (error) {
        console.error("Error associating interview with user:", error);
        return { success: false };
    }
}