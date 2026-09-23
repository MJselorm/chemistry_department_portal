"""
Seed script for chemistry department directory data.
Safely and idempotently populates initial realistic directory records
for executives, lecturers, consultation hours, courses, clubs, committees, and contacts.
"""
from datetime import time
from app.database import SessionLocal
from app import directory_models as m

def seed():
    session = SessionLocal()
    try:
        # 1. Department
        dept = session.query(m.Department).filter_by(code="CHEM").first()
        if not dept:
            dept = m.Department(
                name="Department of Chemistry",
                code="CHEM",
                description="Department of Chemistry, School of Physical & Mathematical Sciences.",
                email="chemistry@ug.edu.gh",
                phone="+233 30 250 0123",
                location="Science Complex, Block B",
                website="https://chemistry.ug.edu.gh",
                is_active=True,
            )
            session.add(dept)
            session.commit()
            session.refresh(dept)
        dept_id = dept.id

        # 2. Executives
        if session.query(m.Executive).count() == 0:
            executives = [
                m.Executive(
                    name="Jane Doe",
                    position="GSCS President",
                    student_id="10928341",
                    level="400",
                    program="BSc Chemistry",
                    email="j.doe@st.ug.edu.gh",
                    phone="+233 24 123 4567",
                    academic_year="2025/2026",
                    department_id=dept_id,
                    bio="Leading the Ghana Society of Chemistry Students (GSCS) to advance student welfare, research initiatives, and academic excellence.",
                    display_order=10,
                    is_active=True,
                ),
                m.Executive(
                    name="John Smith",
                    position="General Secretary",
                    student_id="10934892",
                    level="300",
                    program="BSc Chemistry",
                    email="j.smith@st.ug.edu.gh",
                    phone="+233 20 234 5678",
                    academic_year="2025/2026",
                    department_id=dept_id,
                    bio="Managing official correspondence, meeting minutes, and student directory updates for the departmental society.",
                    display_order=8,
                    is_active=True,
                ),
                m.Executive(
                    name="Ama Richards",
                    position="Academic Coordinator",
                    student_id="10947219",
                    level="400",
                    program="BSc Chemistry",
                    email="a.richards@st.ug.edu.gh",
                    phone="+233 55 345 6789",
                    academic_year="2025/2026",
                    department_id=dept_id,
                    bio="Coordinating peer tutoring, revision sessions, syllabus distribution, and past question repositories.",
                    display_order=6,
                    is_active=True,
                ),
            ]
            session.add_all(executives)
            session.commit()
            print(f"Seeded {len(executives)} executives.")

        # 3. Class Representatives (check if we need more levels)
        if session.query(m.ClassRepresentative).count() < 3:
            reps = [
                m.ClassRepresentative(
                    name="Kwame Mensah",
                    student_id="10951122",
                    level="200",
                    class_name="Level 200 Chem A",
                    program="BSc Chemistry",
                    academic_year="2025/2026",
                    department_id=dept_id,
                    email="k.mensah@st.ug.edu.gh",
                    phone="+233 24 555 1212",
                    is_active=True,
                ),
                m.ClassRepresentative(
                    name="Akua Osei",
                    student_id="10963344",
                    level="300",
                    class_name="Level 300 Chem B",
                    program="BSc Chemistry",
                    academic_year="2025/2026",
                    department_id=dept_id,
                    email="a.osei@st.ug.edu.gh",
                    phone="+233 26 777 3434",
                    is_active=True,
                ),
            ]
            session.add_all(reps)
            session.commit()
            print(f"Seeded additional class representatives.")

        # 4. Lecturers & Consultation Hours
        if session.query(m.Lecturer).count() == 0:
            lecturer1 = m.Lecturer(
                name="Robert Brown",
                title="Dr.",
                staff_id="STF-CHEM-009",
                department_id=dept_id,
                faculty="Faculty of Physical & Computational Sciences",
                email="rbrown@ug.edu.gh",
                phone="+233 24 456 7890",
                office="Room 204, Chemistry Wing",
                specialization="Physical Chemistry, Thermodynamics & Kinetics",
                qualification="Ph.D (Cambridge), M.Phil (Legon)",
                bio="Senior Lecturer in Physical Chemistry specializing in chemical thermodynamics, statistical mechanics, and electrochemical reaction kinetics.",
                is_active=True,
            )
            lecturer2 = m.Lecturer(
                name="Margaret Hansen",
                title="Prof.",
                staff_id="STF-CHEM-001",
                department_id=dept_id,
                faculty="Faculty of Physical & Computational Sciences",
                email="mhansen@ug.edu.gh",
                phone="+233 30 251 2233",
                office="HoD Office, 1st Floor Science Complex",
                specialization="Organic Synthesis & Natural Product Chemistry",
                qualification="Ph.D (Oxford), B.Sc (Legon)",
                bio="Head of Department and Professor of Organic Chemistry with 20+ years of research in natural products and antimicrobial synthesis.",
                is_active=True,
            )
            lecturer3 = m.Lecturer(
                name="Kwame Mensah",
                title="Dr.",
                staff_id="STF-CHEM-014",
                department_id=dept_id,
                faculty="Faculty of Physical & Computational Sciences",
                email="kmensah@ug.edu.gh",
                phone="+233 20 888 9900",
                office="Lab Block Rm 105",
                specialization="Analytical Chemistry & Environmental Instrumentation",
                qualification="Ph.D (Leeds)",
                bio="Senior Lecturer overseeing spectroscopy instrumentation and environmental pollutant trace analysis.",
                is_active=True,
            )
            session.add_all([lecturer1, lecturer2, lecturer3])
            session.commit()
            session.refresh(lecturer1)
            session.refresh(lecturer2)
            session.refresh(lecturer3)

            # Consultations
            consultations = [
                m.LecturerConsultation(
                    lecturer_id=lecturer1.id,
                    day_of_week="Tuesday",
                    start_time=time(10, 0),
                    end_time=time(12, 0),
                    location="Room 204, Chemistry Wing",
                    mode="In-Person",
                    instructions="Students should bring lab workbooks and lecture problem sets.",
                    is_active=True,
                ),
                m.LecturerConsultation(
                    lecturer_id=lecturer1.id,
                    day_of_week="Thursday",
                    start_time=time(14, 0),
                    end_time=time(16, 0),
                    location="Google Meet (Link on Course Portal)",
                    mode="Virtual",
                    instructions="Sign up 24 hours prior via course representative.",
                    is_active=True,
                ),
                m.LecturerConsultation(
                    lecturer_id=lecturer2.id,
                    day_of_week="Wednesday",
                    start_time=time(11, 0),
                    end_time=time(13, 0),
                    location="HoD Office, 1st Floor",
                    mode="In-Person",
                    instructions="By appointment or open door for final year project advisees.",
                    is_active=True,
                ),
            ]
            session.add_all(consultations)
            session.commit()
            print(f"Seeded 3 lecturers and consultation schedules.")

        # 5. Courses
        if session.query(m.Course).count() == 0:
            doc_brown = session.query(m.Lecturer).filter(m.Lecturer.name.ilike("%Brown%")).first()
            prof_hansen = session.query(m.Lecturer).filter(m.Lecturer.name.ilike("%Hansen%")).first()

            courses = [
                m.Course(
                    course_code="CHEM 101",
                    course_name="General Chemistry I",
                    description="Fundamental concepts of atomic structure, periodic properties, chemical bonding, stoichiometry, and states of matter.",
                    credit_hours=3,
                    level="100",
                    semester="First Semester",
                    department_id=dept_id,
                    lecturer_id=prof_hansen.id if prof_hansen else None,
                    is_active=True,
                ),
                m.Course(
                    course_code="CHEM 201",
                    course_name="Physical Chemistry I (Thermodynamics)",
                    description="Laws of classical thermodynamics, thermochemistry, phase equilibria, and chemical reaction equilibrium.",
                    credit_hours=3,
                    level="200",
                    semester="First Semester",
                    department_id=dept_id,
                    lecturer_id=doc_brown.id if doc_brown else None,
                    is_active=True,
                ),
                m.Course(
                    course_code="CHEM 301",
                    course_name="Advanced Organic Chemistry",
                    description="Mechanistic organic chemistry, stereochemistry, reactive intermediates, pericyclic reactions, and modern synthetic methods.",
                    credit_hours=3,
                    level="300",
                    semester="First Semester",
                    department_id=dept_id,
                    lecturer_id=prof_hansen.id if prof_hansen else None,
                    is_active=True,
                ),
                m.Course(
                    course_code="CHEM 402",
                    course_name="Coordination Chemistry & Catalysis",
                    description="Crystal field theory, ligand field theory, electronic spectra of transition metals, and organometallic homogeneous catalysis.",
                    credit_hours=3,
                    level="400",
                    semester="Second Semester",
                    department_id=dept_id,
                    lecturer_id=doc_brown.id if doc_brown else None,
                    is_active=True,
                ),
            ]
            session.add_all(courses)
            session.commit()
            print(f"Seeded {len(courses)} courses.")

        # 6. Clubs
        if session.query(m.Club).count() == 0:
            clubs = [
                m.Club(
                    name="Chemical Society of Ghana - Student Chapter",
                    acronym="CSG",
                    description="The premier student association dedicated to academic excellence, laboratory innovation, and chemical industry career fairs.",
                    category="Academic",
                    president="Jane Doe",
                    contact_email="csg@st.ug.edu.gh",
                    contact_phone="+233 24 123 4567",
                    meeting_location="Science Complex Seminar Room 2",
                    meeting_day="Friday",
                    meeting_time=time(16, 0),
                    social_links="https://instagram.com/csg_ug",
                    department_id=dept_id,
                    is_active=True,
                ),
                m.Club(
                    name="Chemistry Peer Mentorship Network",
                    acronym="CPMN",
                    description="Connecting level 100 and 200 chemistry students with senior peers for academic tutorials, lab skills, and exam preparation.",
                    category="Academic",
                    president="Ama Richards",
                    contact_email="mentor.chem@st.ug.edu.gh",
                    contact_phone="+233 55 345 6789",
                    meeting_location="Main Library Study Room 4",
                    meeting_day="Saturday",
                    meeting_time=time(10, 30),
                    department_id=dept_id,
                    is_active=True,
                ),
            ]
            session.add_all(clubs)
            session.commit()
            print(f"Seeded {len(clubs)} clubs.")

        # 7. Committees
        if session.query(m.Committee).count() == 0:
            comm = m.Committee(
                name="Departmental Curriculum & Examination Committee",
                description="Oversees course offerings, curriculum updates, and examination timetables.",
                purpose="Ensure high academic rigor, moderation of exam papers, and accreditation alignment.",
                chairperson="Prof. Margaret Hansen",
                secretary="Dr. Robert Brown",
                contact_email="curriculum.chem@ug.edu.gh",
                contact_phone="+233 30 251 2233",
                department_id=dept_id,
                academic_year="2025/2026",
                is_active=True,
            )
            session.add(comm)
            session.commit()
            session.refresh(comm)

            members = [
                m.CommitteeMember(
                    committee_id=comm.id,
                    name="Prof. Margaret Hansen",
                    role="Chairperson",
                    email="mhansen@ug.edu.gh",
                    phone="+233 30 251 2233",
                ),
                m.CommitteeMember(
                    committee_id=comm.id,
                    name="Dr. Robert Brown",
                    role="Secretary",
                    email="rbrown@ug.edu.gh",
                    phone="+233 24 456 7890",
                ),
                m.CommitteeMember(
                    committee_id=comm.id,
                    name="Jane Doe",
                    role="Student Representative (GSCS President)",
                    student_id="10928341",
                    email="j.doe@st.ug.edu.gh",
                    phone="+233 24 123 4567",
                ),
            ]
            session.add_all(members)
            session.commit()
            print(f"Seeded committee with {len(members)} members.")

        # 8. Contacts
        if session.query(m.DepartmentContact).count() <= 1:
            contacts = [
                m.DepartmentContact(
                    name="Chemistry Stores & Chemical Inventory",
                    role="Chief Laboratory Technologist",
                    department="Department of Chemistry",
                    description="Dispensing of laboratory reagents, glassware checkout, and inventory catalog.",
                    phone="+233 30 250 8899",
                    email="stores.chem@ug.edu.gh",
                    office="Room G-12, Ground Floor",
                    location="Science Complex, Block B",
                    website="https://chemistry.ug.edu.gh/stores",
                    category="Laboratory",
                    is_active=True,
                ),
                m.DepartmentContact(
                    name="Head of Department Secretariat",
                    role="Administrative Secretary",
                    department="Department of Chemistry",
                    description="Official student petitions, introductory letters, and departmental general inquiries.",
                    phone="+233 30 250 0123",
                    email="chemistry@ug.edu.gh",
                    office="Room 101, 1st Floor",
                    location="Science Complex, Block B",
                    website="https://chemistry.ug.edu.gh",
                    category="Administration",
                    is_active=True,
                ),
                m.DepartmentContact(
                    name="Chemistry First Aid & Safety Desk",
                    role="Safety Officer",
                    department="Department of Chemistry",
                    description="Emergency chemical spill response, eyewash station checks, and first aid.",
                    phone="+233 24 999 1122",
                    email="safety.chem@ug.edu.gh",
                    office="Ground Floor Safety Hub",
                    location="Science Complex, Block B",
                    category="Emergency",
                    is_active=True,
                ),
            ]
            session.add_all(contacts)
            session.commit()
            print(f"Seeded {len(contacts)} additional contacts.")

        print("Directory seeding completed successfully!")
    finally:
        session.close()

if __name__ == "__main__":
    seed()
