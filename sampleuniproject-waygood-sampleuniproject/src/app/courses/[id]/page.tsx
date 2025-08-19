import { courses } from '@/lib/data/courses';
import { universities } from '@/lib/data/universities';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  BookUser,
  Building2,
  Calendar,
  CircleDollarSign,
  Clock,
  FileText,
  GanttChartSquare,
  Globe,
  GraduationCap,
  Languages,
  Milestone,
  School,
  Target,
} from 'lucide-react';
import Image from 'next/image';

interface DetailPageProps {
  params: {
    id: string;
  };
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-4">
    <div className="text-accent flex-shrink-0 mt-1">{icon}</div>
    <div>
      <p className="font-semibold text-primary">{label}</p>
      <p className="text-muted-foreground">{value}</p>
    </div>
  </div>
);


export default function CourseDetailPage({ params }: DetailPageProps) {
  const course = courses.find((c) => c.uniqueId === params.id);
  if (!course) {
    notFound();
  }

  const university = universities.find((u) => u.uniqueCode === course.universityCode);

  return (
    <div className="bg-background">
      <div className="container mx-auto py-12 px-4">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="bg-card">
                <Badge variant="secondary" className="w-fit mb-2">{course.courseLevel}</Badge>
                <CardTitle className="font-headline text-4xl text-primary">{course.courseName}</CardTitle>
                <CardDescription className="text-lg flex items-center gap-2 pt-2">
                  <School className="h-5 w-5" /> {course.universityName}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div>
                  <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">Overview</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{course.overviewDescription}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={<GanttChartSquare />} label="Discipline" value={course.disciplineMajor} />
                  <DetailItem icon={<BookUser />} label="Department" value={course.departmentSchool} />
                  <DetailItem icon={<Clock />} label="Duration" value={`${course.durationMonths} months`} />
                  <DetailItem icon={<GraduationCap />} label="Credits" value={`${course.credits} credits`} />
                  <DetailItem icon={<Languages />} label="Language" value={course.languageOfInstruction} />
                  <DetailItem icon={<Milestone />} label="Attendance" value={course.attendanceType} />
                </div>
                
                 <div>
                  <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">Learning Outcomes</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {course.learningOutcomes.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>

              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2 text-primary">
                  <CircleDollarSign /> Fees & Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailItem icon={<CircleDollarSign />} label="1st Year Tuition" value={`${course.firstYearTuitionFee.toLocaleString()} ${course.tuitionFeeCurrency}`} />
                <DetailItem icon={<Calendar />} label="Int'l Deadline" value={new Date(course.internationalApplicationDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <DetailItem icon={<Calendar />} label="Domestic Deadline" value={new Date(course.domesticApplicationDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                 <Button asChild className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href={university?.officialWebsite || '#'} target="_blank">
                      Apply Now <Globe className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2 text-primary">
                    <FileText /> Admission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <DetailItem icon={<Target />} label="IELTS Score" value={`Minimum ${course.minimumIELTSScore}`} />
                 <DetailItem icon={<Target />} label="Undergraduate Degree" value={course.undergraduateDegreeRequirement || 'Not specified'} />
                 <DetailItem icon={<Target />} label="SAT / ACT" value={course.satRequired || course.actRequired ? 'Required' : 'Not Required'} />
              </CardContent>
            </Card>

            {university && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2 text-primary">
                            <Building2 /> About University
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {university.imageUrl && <Image data-ai-hint="university campus" src={university.imageUrl} alt={university.universityName} width={400} height={200} className="rounded-md w-full object-cover" />}
                        <p className="text-muted-foreground text-sm">{university.description}</p>
                    </CardContent>
                </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
