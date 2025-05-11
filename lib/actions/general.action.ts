'use server';

import { feedbackSchema } from '@/constants';
import { db } from '@/firebase/admin';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';

/**
 * Get interviews created by the user and interviews they've taken
 */
export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
    if (!userId) return [];
    
    try {
        // 1. Get all original interviews created by this user
        const createdInterviews = await db
            .collection("interviews")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();
            
        // 2. Get all feedback documents for this user (to find interviews they've taken)
        const userFeedback = await db
            .collection("feedback")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();
            
        // Extract interview IDs from feedback
        const takenInterviewIds = new Set(
            userFeedback.docs.map(doc => doc.data().interviewId)
        );
        
        // 3. Get the interviews that this user has taken
        const takenInterviews = takenInterviewIds.size > 0 
            ? await db
                .collection("interviews")
                .where("__name__", "in", Array.from(takenInterviewIds))
                .get()
            : { docs: [] };
            
        // 4. Combine both sets of interviews, exclude duplicates
        const allInterviewDocs = [...createdInterviews.docs, ...takenInterviews.docs];
        const uniqueInterviews = new Map();
        
        allInterviewDocs.forEach(doc => {
            // Use interview ID as unique key
            uniqueInterviews.set(doc.id, {
                id: doc.id,
                ...doc.data()
            });
        });
        
        return Array.from(uniqueInterviews.values()) as Interview[];
    } catch (error) {
        console.error("Error getting user interviews:", error);
        return null;
    }
}

/**
 * Get available interview templates this user hasn't taken yet
 */
export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    try {
        // 1. If no user ID provided, return available interviews
        if (!userId) {
            const availableInterviews = await db
                .collection("interviews")
                .where("finalized", "==", true)
                .orderBy("createdAt", "desc")
                .limit(limit)
                .get();
                
            return availableInterviews.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Interview[];
        }
        
        // 2. Get all feedback for this user to determine which interviews they've taken
        const userFeedback = await db
            .collection("feedback")
            .where("userId", "==", userId)
            .get();
            
        // Create a set of interview IDs the user has already taken
        const takenInterviewIds = new Set(
            userFeedback.docs.map(doc => doc.data().interviewId)
        );
        
        // 3. Get interviews this user hasn't taken and weren't created by them
        const availableInterviews = await db
            .collection("interviews")
            .where("finalized", "==", true)
            .where("userId", "!=", userId)
            .orderBy("userId") // Required for the compound query
            .orderBy("createdAt", "desc")
            .limit(limit * 2) // Get more to account for filtering
            .get();
            
        // 4. Filter out interviews that the user has already taken
        const filteredInterviews = availableInterviews.docs
            .filter(doc => !takenInterviewIds.has(doc.id))
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Interview[];
            
        // 5. Deduplicate by role+techstack if needed
        const uniqueInterviews = deduplicateInterviews(filteredInterviews);
        
        return uniqueInterviews.slice(0, limit);
    } catch (error) {
        console.error("Error getting available interviews:", error);
        return null;
    }
}

// Helper function to deduplicate interviews based on role and techstack
function deduplicateInterviews(interviews: Interview[]): Interview[] {
    // Use a map to track unique interviews by role + techstack combination
    const uniqueInterviews = new Map<string, Interview>();
    
    interviews.forEach(interview => {
        const key = `${interview.role.toLowerCase()}_${(interview.techstack || []).sort().join('_')}`;
        
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
    try {
        const interview = await db
            .collection("interviews")
            .doc(id)
            .get();
    
        if (!interview.exists) return null;
        
        return {
            id: interview.id,
            ...interview.data()
        } as Interview;
    } catch (error) {
        console.error("Error getting interview by ID:", error);
        return null;
    }
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

        // First, check if there's already a feedback for this user and interview
        const existingFeedback = await db
            .collection("feedback")
            .where("interviewId", "==", interviewId)
            .where("userId", "==", userId)
            .get();
            
        let feedbackId;
        
        if (!existingFeedback.empty) {
            // Update existing feedback
            feedbackId = existingFeedback.docs[0].id;
            await db.collection("feedback").doc(feedbackId).update({
                totalScore,
                categoryScores,
                strengths,
                areasForImprovement,
                finalAssessment,
                createdAt: new Date().toISOString()
            });
        } else {
            // Create new feedback
            const feedbackRef = await db
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
                });
                
            feedbackId = feedbackRef.id;
        }

        return {
            success: true,
            feedbackId
        }
    } catch (error) {
        console.error("Error saving feedback", error);
        return { success: false }
    }
}

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null> {
    const { interviewId, userId } = params;
    
    if (!interviewId || !userId) return null;

    try {
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
    } catch (error) {
        console.error("Error getting feedback:", error);
        return null;
    }
}

export async function associateInterviewWithUser(params: {interviewId: string, userId: string}): Promise<{success: boolean, newInterviewId?: string}> {
    const { interviewId, userId } = params;
    
    if (!interviewId || !userId) {
        return { success: false };
    }
    
    try {
        // Get the interview to associate with the user
        const interviewDoc = await db.collection("interviews").doc(interviewId).get();
        if (!interviewDoc.exists) {
            return { success: false };
        }
        
        // Check if user already has feedback for this interview
        const existingFeedback = await db
            .collection("feedback")
            .where("interviewId", "==", interviewId)
            .where("userId", "==", userId)
            .limit(1)
            .get();
            
        if (!existingFeedback.empty) {
            // User has already taken this interview, just return the interview ID
            return { 
                success: true, 
                newInterviewId: interviewId
            };
        }
        
        // Create an initial empty feedback to track that the user has taken this interview
        await db.collection("feedback").add({
            interviewId,
            userId,
            totalScore: 0,
            categoryScores: [],
            strengths: [],
            areasForImprovement: [],
            finalAssessment: "",
            createdAt: new Date().toISOString()
        });
        
        return { 
            success: true,
            newInterviewId: interviewId
        };
    } catch (error) {
        console.error("Error associating interview with user:", error);
        return { success: false };
    }
}