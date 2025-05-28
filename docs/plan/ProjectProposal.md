# Project Plan for TA Allocation and Management System

**Team Number:** 2


**Team Members:**
- Naman Arora
- Ariana Rice
- Varun Patel
- Reyhan Reginald
- Aadil Shaji
- Devstutya Pandey
- Shan Richards

## Overview:

### Project purpose or justification (UVP)

The purpose of this software is to streamline the process of TA allocation and management within the CMPS department. It addresses current inefficiencies and fragmentation by consolidating the many moving pieces into a single, easy-to-use platform. No more endless back-and-forth communication; no more sifting through folders on your computer to no avail; and, as a student, no more starting from scratch every time you apply. It further offers visualization and reporting tools that are informative, yet intuitive. Overall, our software brings clarity and coordination to a process that desperately needs it, improving the experience for instructors and students alike.



### High-level project description and boundaries

This platform will support the management and allocation of Teaching Assistant (TA) positions.


**Students** can create an account and apply to open TA positions. They can see the status of their applications and accept/decline offers for TA positions. Upon acceptance, their assigned TA schedule will be visible in a calendar.

**Instructors** are assigned the courses they are teaching, they can then submit any skill/qualification preferences they have for each. Once allocation is complete, they can view the details and export them for easy access.

**TA Coordinators (Admin Users)** can input/upload course offerings and the TA requirements for each. They can view instructor preferences and student profiles, as well as allocate TAs to courses. They can also visualize assignment details and import/export data as TBD by client.


### System Boundaries

The system will not :  
- Include automated TA matching or optimization algorithms (e.g., no automatic balancing or best-fit recommendation engine).  
- Include an interview management system (if TA coordinators  want to interview applicants, this would be managed outside the platform; the system assumes that final TA assignments are handled/administered by coordinators).  
- Manage payroll, contracts, or other HR functions.  
- Integrate with pre-existing UBCO information systems.
- Include the ability for Instructors to select or interview preferred Teaching Assistants for their courses. 

### Measurable project objectives and related success criteria (scope of project)

- Complete Final Web Application by August 2025
  - Success Criteria: At least 95% of the identified functional requirements are fully implemented, tested, and approved by the client by the project deadline.
  - Measured By: Final client feedback, user testing reports, and issue tracking metrics.

- Maintain Rigorous Pull Request (PR) Review Process
  - Success Criteria: 100% of merged PRs must be reviewed by at least two other team members (authors may not review their own code).
  - Measured By: Git commit history and PR review logs showing comments, approvals, and feedback iterations.


- Complete MVP by June 27, 2025
  - Success Criteria: A complete, working Minimum Viable Product (MVP) along with basic documentation is merged into the main branch by June 27, 2025 at EOD.
  - Measured By: Git repository logs, team checklist, and internal feature audit confirming MVP completeness and stability.


## Users, Usage Scenarios and High Level Requirements 

### Users Groups:

Three primary users were identified for the system and proto-personas were created for each.

- Students: This user group includes both graduate and undergraduate students who interact directly with the system by applying for available TA positions.
  
  ![image](https://github.com/user-attachments/assets/d71fc7b1-64d1-4b06-bca3-2d63f0fbcc76)


- Instructors: This user group includes faculty members responsible for teaching courses who use the system to submit TA preferences and view TAs allocated to their courses.  
   ![image](https://github.com/user-attachments/assets/cc16651b-4d15-424d-b56c-171149e78a2d)


- TA Coordinators: This user group includes administrative staff and TA coordinators who manage course listings, TA positions, and oversee the assignment of TAs each term.
  
   ![image](https://github.com/user-attachments/assets/2b8fb2db-2a56-4b72-9fee-5ff24ab0c5fe)

  


### Envisioned Usage

##### Student Scenario

Jill is an undergraduate student who hopes to TA a CMPS course next school year. She creates an account and then logs in using her credentials. Then, she begins her application, adding the required personal information and uploading documents like her resume and transcript. She also provides her availability and preferred number of hours for each term. Next, she browses the courses which have open positions and indicates the ones that are of interest to her. Satisfied, she submits her application. After that, she navigates to her profile page and sees that her application was successfully submitted, so she logs out. 

A few weeks later, Jill receives an email that she has been offered a TA position, so she logs into her account. After navigating to her profile page, she sees that there is, indeed, an offer. She reviews the details of her assignment and then checks her planner to verify that it will work with her schedule. Seeing that it does, she decides to accept the offer. She excitedly awaits further instructions from the professor.

##### Instructor Scenario

Dr. Nguyen, a computer science professor, logs into the system prior to the start of a new academic year. He navigates to his profile and review what courses he will be teaching in each term. For his more technical courses, he notes a few key qualities/skills that he would prefer for those TAs to possess and lets the TA  cordinator know. He skips this step for the courses he is less particular about. Dr. Nguyen then logs out for the day.

A week later, Dr. Nguyen receives an email informing him that TA allocation is complete for his Computer Programming I course. He logs into the system and navigates to his profile to view the specifics. Feeling pleased, he exports the information, which includes his TA's names and email addresses, and logs out. With their contact information at the ready, Dr. Nguyen begins drafting an email to his newly appointed TAs to schedule an onboarding meeting.

##### TA Coordinator/Admin Scenario: 

Dr. Mavis, a statistics professor who oversees TA appointments within her department, logs into the system to get a start on TA planning. First, she uploads the finalized list of courses and their TA requirements for the upcoming school year. Then she imports a batch of spreadsheets containing details of last year's TA appointments. Finally, she sets the application timeframe (i.e. when applications open/are due) for this year. She then logs out for the day, excited for applications to begin trickling in.

On the day that TA applications are due, Dr. Mavis logs back into the system, with a plan to tackle TA allocations for Computer Programming I. She navigates to the course and sees that the Instructor has noted a few preferred skills. Bearing these in mind, she begins reviewing candidate resumes and transcripts one by one. When she finds a potential match, she allocates that student to the course. Occassionally, Dr. Mavis is notified by the system that she has assigned a student too many hours or that there's a schedule conflict, so she adjusts her allocation in response. Once all TA positions have been filled, with no system alerts, and to Dr. Mavis' satisfaction, she submits the allocation, notifying the professor and newly-appointed TAs. Then Dr. Mavis logs out, eager to return bright and early tomorrow to continue allocating TAs and monitoring offer responses.

### Requirements:

#### Functional Requirements:

##### Login & Registration

- System will enable students to create an account using an email, password, and required personal information.
- System will perform data validation as required during account creation (Ex: student number must be 8 digit number)
- System will authenticate users when they login with their email and password.
- System will allow authenticated users to logout.
- System will allow users (Students, Instructors, and TA Coordinators) to reset their password.

##### File Processing for Previous TA

- System will be able to receive, validate, and process files containing previous TA appointments (CSV format, specifics TBD at later date).
- System will securely store data it receives from CSV files.
- System will report/log errors related to file uploads or invalid data when they occur.

##### Content Access

- System will allow all users (including not logged-in) to access information on available positions.
- System will allow only authenticated users to access content pertaining to scheduling, allocation, and management. Specifically,
   - System will allow only authenticated TA/Student users to access web forms for job applications.
   - System will allow only authenticated Instructors (and the Coordinator) to access TA appointment information for their assigned courses.

##### TA/Student Dashboards and Data Modification

- System will provide role-specific dashboards for authenticated users.
- System will allow TA/Student users to input their academic term availability.
- System will allow TA/Student users to update their academic term availability before the application deadline.
- System will allow TA/Student users to upload supporting documents, namely resume and transcript.
- System will allow TA/Student users to update (reupload) their supporting documents.
- System will store TA/Student users' personal information and supporting documents
- System will enforce document size to ensure data consistency.

##### TA/Student Functionality
- System will allow students to create a profile containing personal details.
- System will allow students to apply for open TA positions.
- System will only allow the student to submit one application per TA position.
- System will allow students to accept or decline an offer for a TA position.
- System will notify students if they receive an offer from a TA coordinator.
- System will provide a calendar view for students to view their TA schedule.

#### Instructor Functionality

- System will allow instructors to communicate TA preferences to the TA coordinator.
- System will notify the instructor when TAs have been hired for their class.
- System will allow instructors to export data relevant to their courses or assigned TAs (specific formats to be decided).
- System will allow instructors to view assigned TAs for each course. 

#### Administrator (Admin) Functionality

- System will allow TA coordinator users to offer positions to TA/Student users.
- System will allow the TA coordinator to create, update, delete and archive TA job postings. 
- System will allow the TA coordinator to set deadlines for TA applications.
- System will allow the TA coordinator to view historical TA assignments for different courses.
- System will allow the TA coordinator to export system data (specifics to be decided).
- System will allow the TA coordinator to assign instructors to courses.
- System will allow the TA coordinator to manage appointment changes (e.g., reassign or revoke TA assignments).
- System will allow administrators to send system-generated notifications or bulk communications to instructors and TAs.
- System will provide the Admin with a filtered view of applicants by availability for each course.

##### Instructor and Admin Dashboards

- System will allow instructors to see all of their courses.
- System will provide instructors with a visualization of their courses and assigned TAs.
- System will allow instructors to view the availability of their allocated TAs.
- System will provide access to the catalogue of courses for the Admin/Coordinator.
- System will provide visualizations of TA allocations for the Instructor.


#### Non-functional Requirements:

- System will have a responsive UI that fits all desktop/laptop screens and resolutions.
- System will have a simple and easy-to-use UI.
- System will encrypt all personal data prior to storing (student numbers, names, passwords, etc.).
- System will be written to prevent injection attacks.
- System must work on any environment and operating system.
- System must follow a modular architecture to allow for future expansion to other departments.
- System will incorporate data privacy protections aligned with UBC standards.
- System will enforce document size to ensure data consistency.


#### User Requirements:

##### Students

1. Students will be able to create an account using email and password.
2. Students will be able to login using email and password.
3. Students will be able to reset their password in the case that they forget.
4. Students will be able to create/fill out their profile with personal details.
5. Students will be able to upload their resume and transcript.
6. Students will be able to update their profile at any time.
7. Students will be able to delete and reupload documents if needed.
8. Students will be able to input their availability using a calendar interface.
9. Students will be able to modify their availability using the calendar interface.
10. Students will be able to indicate how many hours per week they are available to work.
11. Students will be able to view available TA positions for the upcoming term.
12. Students will be able to apply for open TA positions using their existing profile and documents.
13. Students will be notified when an application is successfully submitted.
14. Students will be able to view the status of their application.
15. Students will be able to accept/decline an appointment once offered.


##### Instructors

1. Instructors will be able to login using their credentials.
2. Instructors will be able to reset their password in the case that they forget.
3. Instructors will have a personalized dashboard showing courses they are assigned to teach.
4. Instructors will be able to view/edit their profile information.
5. Instructors will be able to indicate preferred qualifications, such as skillsets, for each of their courses.
6. Instructors will be able to view the list of TAs assigned to each of their courses after appointments are made by the TA Coordinator.
7. Instructors will be able to view the profiles and contact information of their allocated TAs.

##### TA Coordinators

1. TA Coordinators will be able to login using their credentials.
2. TA Coordinators will be able to reset their passwords in the case that they forget.
3. TA Coordinators will have access to an admin dashboard with full TA management capabilities.
4. TA Coordinators will be able to select or manually add the list of courses offered in the upcoming term.
5. TA Coordinators will be able to assign instructors to courses.
6. TA Coordinators will be able to create TA positions.
7. TA Coordinators will be able to post TA positions.
8. TA Coordinators will be able to view student applications (profiles) for each TA position.
9. TA Coordinators will be able to appoint students to specific TA roles.
10. TA Coordinators will be able to make changes to an appointment (reassigning or revoking an appointment).
11. TA Coordinators will be able to upload CSV files containing previous TA appointments to initialize data in the system.


#### Technical Requirements:

##### Frontend Requirements:

- Built using **React** to enable reusable components and fast development with routing and SSR/SSG capabilities.
- Developed using **JavaScript**, **HTML**, and **CSS**, with **Tailwind CSS** for styling to ensure a responsive and visually clean UI that is also quick to implement.
- Interfaces for 2 primary user roles: **Students** and **Administrators**, each with clearly defined access permissions and features.
- Interface for 1 secondary user role: **Instructor** each with clearly defined access permissions and features.
- Frontend must consume backend data via **RESTful API** calls, handling auth tokens and session states securely.

##### Backend Requirements:
  
- The backend will be built using **Python** and the **Django framework**, which provides a robust, scalable, and secure environment for rapid development.
- RESTful API design following best practices (versioning, clear endpoint structure, HTTP methods).
- **Authentication and Authorization** will be required to restrict access based on roles; likely implemented using **JWT** (JSON Web Tokens).
- **Docker** will be used to containerize the application, ensuring consistency across development and production environments. This simplifies deployment, onboarding new developers, and scaling the application.

##### Database Requirements:

- Use of a **relational database** (**PostgreSQL**) to store normalized data such as:
   - User profiles (students, instructors, TA coordinators)
   - TA applications and assignments
   - Course details and department data
- Structured relationships will support efficient querying, data integrity, and role-based access.


##### Security & Compliance:

- Use of **secure authentication mechanisms** (e.g., hashed passwords, HTTPS for communication).
- Proper data validation and sanitization to prevent common web vulnerabilities.
- Role-based access control to prevent privilege escalation.


##### DevOps & CI/CD:

- Code managed via **GitHub**, with a strict PR review policy (all PRs reviewed by at least 2 team members, neither of whom are the PR owner/author).
- Use of **CI/CD pipelines** for automatic testing, building, and deploying.
- **Container orchestration** support to deploy microservices efficiently.


##### Other Notes:

- System must be complete and stable by **August 2025**.
- MVP version must be finalized and merged by **June 27, 2025** (goal).
- All features must be tested and reviewed thoroughly before merging.
  
## Tech Stack

### Frontend
- React: because of reusable components, flexible, in-demand, lots of documentation/community support, overall team familiarity (Next.js or Vite)
- JavaScript
- HTML: As it’s necessary for the foundation.
- CSS and Tailwind styling: both as needed to allow flexibility/customization but also faster.


### Backend
- Python and Django Framework (DRF - Django REST framework for APIs)
- Docker: because of portability, scalability, quicker deployment and dev env setup.

### Database
- PostgreSQL as our data is relational.


## High-level risks

- Scope Creep/Feature Overload
  - Description:Attempting to implement too many features beyond the core scope.
  - Impact: Increases complexity, delays critical development milestones, and risks incomplete delivery.
  - Mitigation: Strictly prioritize core functionality. Clearly define MVP and defer nice-to-have features until the core system is stable.

- Team Conflict
  - Description: Disagreements between group members or lack of communication may hinder collaboration and progress.
  - Impact: Reduced productivity, uneven workload distribution, missed deadlines.
  - Mitigation: Establish clear roles, regular team meetings, and a respectful decision-making process. Address issues early through honest and open communication.
  
- Falling behind schedule
  - Description: Failing to meet key deadlines, such as milestone requirements or internal check-ins, to the point that catching up becomes unrealistic.
  - Impact: Rush development, increased bugs, compromised quality, and potential project failure.
  - Mitigation: Regularly track progress using tools like GitHub Projects and Clockify. Assign a team member to monitor timeline adherence.
  
- Technical Challenges/Integration Issues
Description: Unexpected difficulties in integrating frontend/backend, authentication systems, or containerising environments.
Impact: Time-consuming debugging and delays in delivering a functional system.
Mitigation: Select familiar technologies where possible. Conduct early prototyping of critical components. Pair programming or code reviews can catch integration issues early.

- Data Security
  - Description: Mishandling sensitive student or TA data could lead to privacy violations.
  - Impact: Ethical concerns.
  - Mitigation: Follow data privacy best practices (e.g., hashed passwords, secure storage). Only collect data necessary for system operation.
 


## Assumptions and constraints

### Assumptions:
- The TA Allocation and Management System is being developed as a stand-alone system, with no need to integrate with any existing UBCO systems.
- Authentication will be handled internally by the system and will not utilize UBCO student profiles or credentials.
- Users will interact with the system under clearly defined roles: Student/TA, Instructor, and Admin/TA coordinator. These roles would determine access control and functionality.
- The system will be a web application accessible through standard desktop browsers; mobile optimization is optional but not required for MVP.


### Constraints:
- The entire project must be completed within the academic semester, with specific deadlines for milestone requirements and final submissions as defined by capstone requirements.
- Development is limited to the capacity and availability of the 7-member student team, each balancing other various responsibilities.
- The system will only accept one application per posting for a student.
- The tech stack must be chosen based on the team’s collective familiarity and the available support/documentation to avoid learning curve delays.



## Summary milestone schedule



|  Milestone  | Deliverable |
| :-------------: | ------------- |
| May 27th  | Project Plan Submission |
| June 3rd  | Design Submission: Same type of description here. Aim to have a design of the project and the system architecture planned out. Use cases need to be fully developed.  The general user interface design needs to be implemented by this point (mock-ups). This includes having a consistent layout, color scheme, text fonts, etc., and showing how the user will interact with the system should be demonstrated. |
| June 6th  |  A short video presenation decribing the design for the project.  This will be reviewed and the team will receive feedback. |
| June 13th  | Mini-Presentations: A short description of the parts of the envisioned usage you plan to deliver for this milestone. Should not require additional explanation beyond what was already in your envisioned usage. This description should only be a few lines of text long.  This will be presented in the weekly team meeting. Remember that features also need to be tested.  |
| July 4th  | MVP Mini-Presentations: A short description of the parts of the envisioned usage you plan to deliver for this milestone. Should not require additional explanation beyond what was already in your envisioned usage. This description should only be a few lines of text long. Feature set #1 will be completed by this milestone.  Remember that features also need to be tested. Clients will be invited to presentations.|
| July 11th  | Peer testing and feedback: Aim to have an additional features implemented and tested by team member. As the software gets bigger, you will need to be more careful about planning your time for code reviews, integration, and regression testing. |
| July 25th  | Test-O-Rama: Full scale system and user testing with everyone |
| August 8th  |  Final project submission and group presentions - Feature set #2: Details to follow |

## Teamwork Planning and Anticipated Hurdles

Use the table below to help line up everyone’s strengths and areas of improvement together. The table should give the reader some context and explanation about the values in your table.


|  Category  | Shan Richards | Reyhan Reginald | Devstutya Pandey | Naman Arora | Aadil Shaji | Ariana Rice | Varun Patel |
| ------------- | ------------- | ------------- | ------------- | ------------- | ------------- | ------------- | ------------ |
|  **Experience**  | Goodreads clone for web dev course; Live nation clone for 310;  | Canvas clone done for COSC 310, Hackathon projects mainly based on Python, Research Work done with Django  | Canvas Clone done for 310. | Flashcard Study App for COSC 310 | Discord Clone done for 310 | Web Frontend Internship, Goat Sweaters eCommerce Store | Earthquake monitoring dashboard for COSC 310 |
|  **Good At**  | Design and Analysis | Backend Development, Integration, REST APIs, Docker, Some testing experience, Communication, Planning  | Fullstack development, React (Next.js), Testing (unit+end to end)  | Requirements Gathering, Frontend Development, Backend Development , Integration, Docker, Documentation | Backend Development, Testing, Design, and Requirements Gathering | Frontend, UI Design, Requirements, Planning, Presentations or Public Speaking, Docker | Backend development, Python, React, Testing, Docker |
|  **Expect to learn**  | React  | Limited experience in React, Microservices, Advanced items in Django, automation testing. | Reverse Proxy Implementation | Integration Testing, Web Security, PostgreSQL, data security, Django Framework| Django, PostgreSQL, and Microservices | React, Routing, Microservices, Automated Testing | Web & Data security, End 2 End testing, more comprehensive devops practices | 

<br>
<br>
<br>



|  Category of Work/Features  | Shan Richards | Reyhan Reginald | Devstutya Pandey | Naman Arora | Aadil Shaji | Ariana Rice | Varun Patel |
| ------------- | :-------------: | :-------------: | :-------------: | :-------------: | :-------------: | :-------------: | :-------------: | 
|  **Project Management: Kanban Board Maintenance**  |   | ✅  | ✅  | ✅ | ✅ | ✅ | ✅ |
|  **System Architecture Design**  | ✅ |✅ | ✅  | ✅  | ✅ |  | ✅|
|  **User Interface Design**  |   | ✅| | | |✅ | ✅ |
|  **CSS Development**  |  |  |  ✅|  |  | ✅| ✅ |
|  **Backend Dev**  |✅    |✅  | ✅ | ✅ | ✅ | ✅ | ✅|
|  **Database setup**  |  | ✅ | ✅  | ✅  | ✅ |  | ✅ |
|  **Presentation Preparation**  | ✅ | ✅ |✅  | ✅   | ✅ | ✅ |  |
|  **Design Video Creation**  |  |✅  | ✅  |  | ✅ | ✅ |  |
|  **Design Video Editing**  |  | ✅   |  |  |  | ✅ |  |
|  **Design Report**  | ✅  |  ✅| ✅ | ✅ |✅  | ✅ | ✅ |
  **Final Team Report**  |  ✅ | ✅  |  ✅|  ✅|  ✅  |  ✅  | ✅ |

Features are to be decided and built on in the later stages of the project.

