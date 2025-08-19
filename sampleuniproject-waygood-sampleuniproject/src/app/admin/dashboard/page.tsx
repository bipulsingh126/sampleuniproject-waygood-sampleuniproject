'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Building2, CheckCircle, Download } from 'lucide-react';

function UploadCard({ title, description, onUpload, onDownloadTemplate }: { title: string, description: string, onUpload: (file: File) => void, onDownloadTemplate?: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'text/csv') {
        setSelectedFile(file);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please select a .csv file.',
        });
        setSelectedFile(null);
        event.target.value = '';
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      setIsUploading(true);
      // Simulate upload process
      setTimeout(() => {
        onUpload(selectedFile);
        setIsUploading(false);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById(`file-upload-${title}`) as HTMLInputElement;
        if(fileInput) fileInput.value = '';
      }, 1500);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              {title === 'Universities' ? <Building2 className="text-accent"/> : <FileText className="text-accent"/>}
              {title} Data
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {onDownloadTemplate && (
            <Button variant="outline" size="sm" onClick={onDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
            id={`file-upload-${title}`} 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange} 
            disabled={isUploading}
            className="file:text-primary file:font-semibold"
        />
        {selectedFile && <p className="text-sm text-muted-foreground">Selected file: {selectedFile.name}</p>}
        <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
          {isUploading ? (
            'Uploading...'
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Upload CSV
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { toast } = useToast();

  const handleUniversityUpload = (file: File) => {
    toast({
      title: <div className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Success</div>,
      description: `University data from "${file.name}" uploaded successfully.`,
    });
    // In a real app, you would process the file here
  };

  const handleCourseUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/courses/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: <div className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Success</div>,
          description: `Uploaded ${result.summary.insertedCourses} courses successfully. ${result.summary.duplicateCourses > 0 ? `${result.summary.duplicateCourses} duplicates skipped.` : ''}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: result.error || 'Failed to upload course data.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: 'Network error occurred during upload.',
      });
    }
  };

  const handleUniversityTemplateDownload = () => {
    const headers = [
      "University Name", "Unique Code", "Image URL", "Location (City, Country)",
      "Full Address", "Established Year", "Type", "Partner University (Yes/No)",
      "Description", "Long Description", "Official Website", "Email", "Contact Number",
      "Application Fee Waived (Yes/No)", "US News & World Report", "QS Ranking",
      "THE (Times Higher Education)", "ARWU (Shanghai Ranking)", "Our Ranking",
      "Fields of Study (comma-separated)", "Program Offerings (IDs) (comma-separated IDs)",
      "Tuition Fees Min", "Tuition Fees Max", "Tuition Fees Currency",
      "Tuition Fees Notes", "Admission Requirements (use \"\" for multiline)",
      "Campus Life (use \"\" for multiline)"
    ];
    const csvHeader = headers.map(header => `"${header.replace(/"/g, '""')}"`).join(',');
    const blob = new Blob([csvHeader], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "university_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleCourseTemplateDownload = () => {
    const headers = [
      "Unique ID", "Course Name", "Course Code", "University Code", "University Name",
      "Department/School", "Discipline/Major", "Specialization", "Course Level",
      "Overview/Description", "Summary", "Prerequisites (comma-separated)",
      "Learning Outcomes (comma-separated)", "Teaching Methodology",
      "Assessment Methods (comma-separated)", "Credits", "Duration (Months)",
      "Language of Instruction", "Syllabus URL", "Keywords (comma-separated)",
      "Professor Name", "Professor Email", "Office Location",
      "Open for Intake (Year/Semester)", "Admission Open Years", "Attendance Type",
      "1st Year Tuition Fee", "Total Tuition Fee", "Tuition Fee Currency",
      "Application Fee Amount", "Application Fee Currency", "Application Fee Waived (Yes/No)",
      "Required Application Materials", "12th Grade Requirement", "Undergraduate Degree Requirement",
      "Minimum IELTS Score", "Minimum TOEFL Score", "Minimum PTE Score",
      "Minimum Duolingo Score", "Minimum Cambridge English Score", "Other English Tests Accepted",
      "GRE Required (Yes/No)", "GRE Score", "GMAT Required (Yes/No)", "GMAT Score",
      "SAT Required (Yes/No)", "SAT Score", "ACT Required (Yes/No)", "ACT Score",
      "Waiver Options", "Partner Course (Yes/No)", "FT Ranking 2024", "Acceptance Rate",
      "Domestic Application Deadline", "International Application Deadline", "Course URL"
    ];
    const csvHeader = headers.map(header => `"${header.replace(/"/g, '""')}"`).join(',');
    const blob = new Blob([csvHeader], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "course_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="font-headline text-4xl font-bold mb-2 text-primary">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Manage university and course data from here.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <UploadCard
          title="Universities"
          description="Upload a CSV file with university information."
          onUpload={handleUniversityUpload}
          onDownloadTemplate={handleUniversityTemplateDownload}
        />
        <UploadCard
          title="Courses"
          description="Upload a CSV file with course information."
          onUpload={handleCourseUpload}
          onDownloadTemplate={handleCourseTemplateDownload}
        />
      </div>
    </div>
  );
}
