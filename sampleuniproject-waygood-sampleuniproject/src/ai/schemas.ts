import { z } from 'zod';

export const CourseMatchInputSchema = z.object({
  description: z
    .string()
    .min(1, { message: 'Please enter a description.' })
    .describe(
      'The description of the student interests and academic background.'
    ),
});
