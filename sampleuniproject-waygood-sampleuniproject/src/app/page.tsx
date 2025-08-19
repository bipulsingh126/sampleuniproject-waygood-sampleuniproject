'use client';

import { useState, useMemo } from 'react';
import { courses } from '@/lib/data/courses';
import { universities } from '@/lib/data/universities';
import type { Course, University } from '@/lib/types';
import CourseCard from '@/components/course-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Compass, Search, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [tuitionRange, setTuitionRange] = useState([0, 50000]);
  const [courseLevel, setCourseLevel] = useState('all');

  const universityOptions = useMemo(() => {
    return universities.map((uni) => ({ value: uni.uniqueCode, label: uni.universityName }));
  }, []);

  const courseLevels = useMemo(() => {
    const levels = new Set(courses.map(course => course.courseLevel));
    return ['all', ...Array.from(levels)];
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const university = universities.find(uni => uni.uniqueCode === course.universityCode);
      return (
        (course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.overviewDescription.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedUniversity === 'all' || course.universityCode === selectedUniversity) &&
        (course.firstYearTuitionFee >= tuitionRange[0] && course.firstYearTuitionFee <= tuitionRange[1]) &&
        (courseLevel === 'all' || course.courseLevel === courseLevel)
      );
    });
  }, [searchTerm, selectedUniversity, tuitionRange, courseLevel]);

  return (
    <div className="bg-background text-foreground">
      <section className="text-center py-20 px-4 bg-card border-b">
        <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tight text-primary">
          Find Your Perfect Course
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Navigate the world of education with Course Compass. Search thousands of courses from top universities to find the one that's right for you.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="#search">
              <Compass className="mr-2" /> Start Exploring
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/course-match">
              <Sparkles className="mr-2" /> AI Course Match
            </Link>
          </Button>
        </div>
      </section>

      <section id="search" className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="p-6 rounded-lg bg-card shadow-sm sticky top-24">
              <h3 className="font-headline text-2xl font-semibold mb-6 flex items-center gap-2 text-primary">
                <SlidersHorizontal />
                Filters
              </h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="search-term" className="text-sm font-medium">Search by Keyword</label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="search-term"
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="university" className="text-sm font-medium">University</label>
                  <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                    <SelectTrigger id="university" className="w-full mt-2">
                      <SelectValue placeholder="Select University" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Universities</SelectItem>
                      {universityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label htmlFor="course-level" className="text-sm font-medium">Course Level</label>
                  <Select value={courseLevel} onValueChange={setCourseLevel}>
                    <SelectTrigger id="course-level" className="w-full mt-2">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseLevels.map((level) => (
                        <SelectItem key={level} value={level} className="capitalize">
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Max. 1st Year Tuition ({courses[0]?.tuitionFeeCurrency || 'USD'})
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      min={0}
                      max={50000}
                      step={1000}
                      value={[tuitionRange[1]]}
                      onValueChange={(value) => setTuitionRange([tuitionRange[0], value[0]])}
                    />
                  </div>
                  <div className="text-right text-sm text-muted-foreground mt-1">
                    Up to ${tuitionRange[1].toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <h2 className="font-headline text-3xl font-bold mb-6 text-primary">
              {filteredCourses.length} Courses Found
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.uniqueId} course={course} />
              ))}
            </div>
            {filteredCourses.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center bg-card rounded-lg p-12 h-full">
                <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-primary">No Courses Found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters to find what you're looking for.</p>
              </div>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}
