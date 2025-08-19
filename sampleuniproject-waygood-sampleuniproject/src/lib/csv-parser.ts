import { Readable } from 'stream';
import { parse } from 'csv-parse';

export interface CSVCourseData {
  course_id: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: string;
  price: string;
  rating: string;
  skill_level: string;
}

// Function to parse CSV buffer

export async function parseCSVBuffer(buffer: Buffer): Promise<CSVCourseData[]> {
  return new Promise((resolve, reject) => {
    const results: CSVCourseData[] = [];
    const stream = Readable.from(buffer);

    stream
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true
      }))
      .on('data', (data: CSVCourseData) => {
     
        if (data.course_id && data.title && data.description && data.category) {
          results.push(data);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error: Error) => {
        reject(error);
      });
  });
}

// Function to validate course data
export function validateCourseData(data: CSVCourseData): string[] {
  const errors: string[] = [];

  if (!data.course_id) errors.push('course_id is required');
  if (!data.title) errors.push('title is required');
  if (!data.description) errors.push('description is required');
  if (!data.category) errors.push('category is required');
  if (!data.instructor) errors.push('instructor is required');
  if (!data.duration) errors.push('duration is required');
  if (!data.price) errors.push('price is required');
  
  if (data.rating) {
    const rating = parseFloat(data.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      errors.push('rating must be a number between 0 and 5');
    }
  }

  if (data.skill_level && !['beginner', 'intermediate', 'advanced'].includes(data.skill_level)) {
    errors.push('skill_level must be beginner, intermediate, or advanced');
  }
  // Function to validate course data
  return errors;
}
