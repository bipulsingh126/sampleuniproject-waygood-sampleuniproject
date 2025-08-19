import mongoose, { Schema, Document } from 'mongoose';

// Plain data interface for lean queries and API responses
export interface ICourseData {
  course_id: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: string;
  price: string;
  rating: number;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose document interface
export interface ICourse extends ICourseData, Document {}

const CourseSchema = new Schema<ICourse>({
  course_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  instructor: {
    type: String,
    required: true,
    index: true
  },
  duration: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  skill_level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
    index: true
  }
}, {
  timestamps: true
});

CourseSchema.index({ category: 1, skill_level: 1 });
CourseSchema.index({ title: 'text', description: 'text' });

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
