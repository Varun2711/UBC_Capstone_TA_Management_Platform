from django.db import models

class Faculty(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')

    def __str__(self):
        return self.name


class TAScheduler(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='ta_schedulers')

    def __str__(self):
        return f"{self.name} ({self.employee_number})"


class Student(models.Model):
    student_number = models.CharField(max_length=8, unique=True)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, null=True, blank=True)
    program = models.CharField(max_length=100, null=True, blank=True)
    year_standing = models.IntegerField(null=True, blank=True)
    study_level = models.CharField(max_length=20)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    sin = models.CharField(max_length=11, null=True, blank=True)
    password = models.CharField(max_length=255)
    email = models.EmailField()

    def __str__(self):
        return f"{self.name}"

class Instructor(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE)
    email = models.EmailField()

    def __str__(self):
        return f"{self.name}"

class Course(models.Model):
    course_number = models.CharField(max_length=10, primary_key=True)
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=255)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.course_number}"

class CourseOffering(models.Model):
    course_offering_id = models.AutoField(primary_key=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    section_number = models.CharField(max_length=5)
    term_number = models.CharField(max_length=20)
    year_offered = models.IntegerField()
    instructor = models.ForeignKey(Instructor, on_delete=models.SET_NULL, null=True, blank=True)
    day = models.CharField(max_length=10)
    time = models.CharField(max_length=20)

    class Meta:
        unique_together = ('course', 'section_number', 'term_number', 'year_offered')

    def __str__(self):
        return f"{self.course} - {self.section_number} ({self.term_number} {self.year_offered})"

class LabSection(models.Model):
    lab_section_id = models.AutoField(primary_key=True)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE)
    section_number = models.CharField(max_length=5)
    day = models.CharField(max_length=10)
    time = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.course_offering} - Lab {self.section_number} ({self.day} {self.time})"

class InstructorRequest(models.Model):
    request_id = models.AutoField(primary_key=True)
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE)
    request_date = models.DateField()
    request_description = models.TextField()

class JobPosting(models.Model):
    posting_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    post_date = models.DateField()
    deadline_date = models.DateField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey(TAScheduler, on_delete=models.CASCADE)
    requirements = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.department} ({self.post_date})"

class JobPostingCourseOffering(models.Model):
    posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('posting', 'course_offering')

class Application(models.Model):
    application_id = models.AutoField(primary_key=True)
    posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE)
    status = models.CharField(max_length=50)

class ApplicationQuestionResponse(models.Model):
    response_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE)
    question = models.TextField()
    answer = models.TextField()

class ApplicationSelectedCourses(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('application', 'course_offering')

class Offer(models.Model):
    offer_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    offer_date = models.DateField()
    status = models.CharField(max_length=50)
    notes = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(TAScheduler, on_delete=models.CASCADE, related_name='offers_created')

class Assignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE)
    lab_section = models.ForeignKey(LabSection, on_delete=models.SET_NULL, null=True, blank=True)
    assigned_date = models.DateField()
    assigned_by = models.ForeignKey(TAScheduler, on_delete=models.CASCADE, related_name='assignments_made')
    notes = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(TAScheduler, on_delete=models.CASCADE, related_name='assignments_created')

class Shift(models.Model):
    shift_id = models.AutoField(primary_key=True)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    notes = models.TextField(null=True, blank=True)

class Availability(models.Model):
    availability_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    day_of_week = models.CharField(max_length=10)
    start_time = models.TimeField()
    end_time = models.TimeField()
    term_number = models.CharField(max_length=20)

class Document(models.Model):
    document_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.SET_NULL, null=True, blank=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.IntegerField()
    file_link = models.TextField()
    uploaded_at = models.DateField()