// src/ai/flows/course-match.ts
'use server';
/**
 * @fileOverview A course recommendation AI agent.
 *
 * - courseMatch - A function that handles the course recommendation process.
 * - CourseMatchInput - The input type for the courseMatch function.
 * - CourseMatchOutput - The return type for the courseMatch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { CourseMatchInputSchema } from '@/ai/schemas';

export type CourseMatchInput = z.infer<typeof CourseMatchInputSchema>;

const CourseMatchOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      courseName: z.string().describe('The name of the suggested course.'),
      universityName: z.string().describe('The name of the university offering the course.'),
      matchScore: z.number().describe('A score indicating how well the course matches the student interests and background.'),
      rationale: z.string().describe('Explanation of why the course is a good match.')
    })
  ).describe('A list of suggested courses and programs of study.'),
});
export type CourseMatchOutput = z.infer<typeof CourseMatchOutputSchema>;

export async function courseMatch(input: CourseMatchInput): Promise<CourseMatchOutput> {
  return courseMatchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'courseMatchPrompt',
  input: {schema: CourseMatchInputSchema},
  output: {schema: CourseMatchOutputSchema},
  prompt: `You are an expert academic advisor specializing in recommending courses and programs of study to students.

You will use the student's description of their interests and academic background to suggest relevant courses and programs.

Provide a list of suggestions including the course name, university name, a match score (0-100), and a brief explanation of why the course is a good match.

Student Description: {{{description}}}`, 
});

const courseMatchFlow = ai.defineFlow(
  {
    name: 'courseMatchFlow',
    inputSchema: CourseMatchInputSchema,
    outputSchema: CourseMatchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
