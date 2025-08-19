import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not found. Using mock recommendations.');
}

export interface UserPreferences {
  topics: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  format?: 'video' | 'text' | 'interactive' | 'any';
  budget?: 'free' | 'paid' | 'any';
}

export interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  provider: string;
  skillLevel: string;
  duration: string;
  format: string;
  price: string;
  rating: number;
  topics: string[];
  url?: string;
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }
  }

  async generateCourseRecommendations(preferences: UserPreferences): Promise<CourseRecommendation[]> {
    if (!this.genAI) {
    
      return this.getMockRecommendations(preferences);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = this.buildPrompt(preferences);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

     
      return this.parseAIResponse(text, preferences);
    } catch (error) {
      console.error('Gemini AI API error:', error);
      
      return this.getMockRecommendations(preferences);
    }
  }

  private buildPrompt(preferences: UserPreferences): string {
    return `
Generate 5 course recommendations based on these user preferences:
- Topics: ${preferences.topics.join(', ')}
- Skill Level: ${preferences.skillLevel}
- Duration: ${preferences.duration || 'any'}
- Format: ${preferences.format || 'any'}
- Budget: ${preferences.budget || 'any'}

Please provide recommendations in JSON format with the following structure for each course:
{
  "title": "Course Title",
  "description": "Brief course description",
  "provider": "Course Provider",
  "skillLevel": "beginner/intermediate/advanced",
  "duration": "X hours/weeks",
  "format": "video/text/interactive",
  "price": "free/paid/$X",
  "rating": 4.5,
  "topics": ["topic1", "topic2"],
  "url": "https://example.com/course"
}

Return only valid JSON array of 5 course objects.
    `;
  }

  private parseAIResponse(text: string, preferences: UserPreferences): CourseRecommendation[] {
    try {
    
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const courses = JSON.parse(jsonMatch[0]);
        return courses.map((course: any, index: number) => ({
          id: `gemini-${Date.now()}-${index}`,
          title: course.title || 'Untitled Course',
          description: course.description || 'No description available',
          provider: course.provider || 'Unknown Provider',
          skillLevel: course.skillLevel || preferences.skillLevel,
          duration: course.duration || 'Variable',
          format: course.format || 'Mixed',
          price: course.price || 'Unknown',
          rating: course.rating || 4.0,
          topics: course.topics || preferences.topics,
          url: course.url
        }));
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }

  
    return this.getMockRecommendations(preferences);
  }

  private getMockRecommendations(preferences: UserPreferences): CourseRecommendation[] {
    const mockCourses: CourseRecommendation[] = [
      {
        id: 'mock-1',
        title: `Complete ${preferences.topics[0] || 'Programming'} Course`,
        description: `Comprehensive ${preferences.skillLevel} level course covering ${preferences.topics.join(', ')}`,
        provider: 'TechEdu',
        skillLevel: preferences.skillLevel,
        duration: '8 weeks',
        format: 'video',
        price: 'free',
        rating: 4.7,
        topics: preferences.topics,
        url: 'https://example.com/course1'
      },
      {
        id: 'mock-2',
        title: `${preferences.topics[0] || 'Development'} Fundamentals`,
        description: `Learn the basics of ${preferences.topics.join(' and ')} from industry experts`,
        provider: 'CodeAcademy',
        skillLevel: preferences.skillLevel,
        duration: '6 weeks',
        format: 'interactive',
        price: '$49',
        rating: 4.5,
        topics: preferences.topics,
        url: 'https://example.com/course2'
      },
      {
        id: 'mock-3',
        title: `Advanced ${preferences.topics[0] || 'Technology'} Concepts`,
        description: `Deep dive into advanced concepts and real-world applications`,
        provider: 'UniLearn',
        skillLevel: preferences.skillLevel,
        duration: '12 weeks',
        format: 'text',
        price: 'free',
        rating: 4.3,
        topics: preferences.topics,
        url: 'https://example.com/course3'
      },
      {
        id: 'mock-4',
        title: `${preferences.topics.join(' & ')} Bootcamp`,
        description: `Intensive bootcamp covering practical skills and projects`,
        provider: 'SkillUp',
        skillLevel: preferences.skillLevel,
        duration: '4 weeks',
        format: 'video',
        price: '$99',
        rating: 4.8,
        topics: preferences.topics,
        url: 'https://example.com/course4'
      },
      {
        id: 'mock-5',
        title: `Professional ${preferences.topics[0] || 'Development'} Path`,
        description: `Career-focused curriculum designed for professional growth`,
        provider: 'ProLearn',
        skillLevel: preferences.skillLevel,
        duration: '16 weeks',
        format: 'interactive',
        price: '$199',
        rating: 4.6,
        topics: preferences.topics,
        url: 'https://example.com/course5'
      }
    ];

    return mockCourses;
  }
}

export default new GeminiService();
